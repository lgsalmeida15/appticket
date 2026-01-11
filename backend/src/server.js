import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize, { testConnection } from './config/database.js';
import routes from './routes/index.js';
import './models/index.js'; // Importar relacionamentos
import { globalErrorHandler, notFoundHandler } from './middleware/globalErrorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import registrarEventHandlers from './utils/eventHandlers.js';
import cron from 'node-cron';
import chamadoAutoResolucaoService from './services/chamadoAutoResolucaoService.js';

dotenv.config();

// Registrar handlers de eventos para webhooks e auditoria
registrarEventHandlers();
logger.info('Event handlers registrados');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança e parsing
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Permitir acesso a arquivos
}));

// Configurar CORS com validação de origens permitidas
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173']);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar se origem está na lista permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Logging
app.use(morgan('dev')); // Morgan para logs HTTP
app.use(requestLogger); // Logger customizado para requisições

// Rate limiting (aplicado globalmente, exceto onde sobrescrito)
app.use('/api', apiLimiter);

// Parsing de dados
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor AppTicket está rodando',
    timestamp: new Date().toISOString()
  });
});

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AppTicket API Documentation'
}));

// Rotas da API
app.use('/api', routes);

// Middleware 404 (rota não encontrada) - deve vir antes do error handler
app.use(notFoundHandler);

// Middleware de tratamento de erros global - deve vir por último
app.use(globalErrorHandler);

// Inicializar servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco
    const conexaoOK = await testConnection();
    if (conexaoOK) {
      logger.info('Conexão com banco de dados estabelecida');
    }
    
    // Sincronizar models (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('Models sincronizados com o banco de dados');
      console.log('✓ Models sincronizados com o banco de dados.');
    }
    
    // Configurar job agendado para atualizar chamados fechados para resolvido
    // Executa diariamente às 02:00 (2h da manhã)
    let isJobRunning = false; // Flag para prevenir execuções simultâneas
    const jobAutoResolucao = cron.schedule('0 2 * * *', async () => {
      // Prevenir execuções simultâneas
      if (isJobRunning) {
        logger.warn('Job de auto-resolução já está em execução, pulando execução atual...');
        return;
      }
      
      isJobRunning = true;
      try {
        logger.info('Iniciando job de auto-resolução de chamados fechados');
        const resultado = await chamadoAutoResolucaoService.atualizarChamadosFechadosParaResolvido();
        logger.info('Job de auto-resolução concluído', resultado);
      } catch (error) {
        logger.error('Erro ao executar job de auto-resolução', {
          error: error.message,
          stack: error.stack
        });
      } finally {
        // Sempre resetar flag mesmo se houver erro
        isJobRunning = false;
      }
    }, {
      scheduled: false, // Não iniciar automaticamente, vamos iniciar após conexão com BD
      timezone: 'America/Sao_Paulo' // Timezone do Brasil
    });

    // Iniciar o job agendado
    jobAutoResolucao.start();
    logger.info('Job agendado de auto-resolução de chamados iniciado (executa diariamente às 02:00)');
    console.log('✓ Job agendado de auto-resolução configurado (diariamente às 02:00)');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Servidor iniciado na porta ${PORT}`);
      console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor', { error: error.message, stack: error.stack });
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;

