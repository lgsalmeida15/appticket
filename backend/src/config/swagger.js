import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AppTicket API',
      version: '1.0.0',
      description: 'API para sistema de gerenciamento de chamados corporativo',
      contact: {
        name: 'Suporte AppTicket',
        email: 'suporte@appticket.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000/api',
        description: 'Servidor de desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                status: { type: 'number' },
                code: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        },
        Chamado: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            titulo: { type: 'string' },
            descricao: { type: 'string' },
            tipo: { type: 'string', enum: ['incidente', 'requisicao', 'problema', 'mudanca'] },
            prioridade: { type: 'string', enum: ['baixa', 'media', 'alta', 'urgente'] },
            status: { type: 'string', enum: ['novo', 'em_andamento', 'aguardando', 'resolvido', 'fechado', 'cancelado'] },
            grupo_id: { type: 'integer' },
            usuario_id: { type: 'integer' },
            atribuido_a: { type: 'integer', nullable: true },
            data_abertura: { type: 'string', format: 'date-time' },
            data_fechamento: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nome: { type: 'string' },
            email: { type: 'string' },
            tipo: { type: 'string', enum: ['admin', 'gerente', 'agente'] },
            ativo: { type: 'boolean' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Endpoints de autenticação' },
      { name: 'Chamados', description: 'Endpoints de chamados' },
      { name: 'Usuários', description: 'Endpoints de usuários' },
      { name: 'Grupos', description: 'Endpoints de grupos' },
      { name: 'SLA', description: 'Endpoints de SLA' },
      { name: 'Time Tracking', description: 'Endpoints de controle de tempo' },
      { name: 'Dashboard', description: 'Endpoints de dashboard' },
      { name: 'Webhooks', description: 'Endpoints de webhooks' }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
