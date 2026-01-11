import logger from '../utils/logger.js';

/**
 * Middleware para logar todas as requisições
 * Registra: rota, método, usuário autenticado, IP, timestamp, payload (sanitizado)
 * Não loga senhas ou dados sensíveis
 */
export const requestLogger = (req, res, next) => {
  // Sanitizar body para não logar informações sensíveis
  const sanitizedBody = { ...req.body };
  
  // Remover campos sensíveis
  const sensitiveFields = ['password', 'senha', 'token', 'access_token', 'refresh_token'];
  sensitiveFields.forEach(field => {
    if (sanitizedBody[field]) {
      sanitizedBody[field] = '[REDACTED]';
    }
  });

  // Log apenas se não for rota de health check
  if (req.path !== '/health' && req.path !== '/api/health') {
    logger.info('Requisição recebida', {
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      body: Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined,
      ip: req.ip || req.connection.remoteAddress,
      userId: req.usuario?.id,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }

  next();
};

export default requestLogger;

