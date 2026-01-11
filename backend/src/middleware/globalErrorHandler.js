import logger from '../utils/logger.js';
import auditoriaService from '../services/auditoriaService.js';
import AppError from '../utils/AppError.js';

/**
 * Middleware global de tratamento de erros
 * Captura todas exceções não tratadas e formata resposta padronizada
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error('Erro capturado pelo handler global:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.usuario?.id,
    ip: req.ip
  });

  // Registrar erros críticos (500) na auditoria
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    auditoriaService.registrarErroCritico(req.usuario?.id || null, err, req).catch(auditError => {
      logger.error('Erro ao registrar erro crítico na auditoria', { error: auditError.message });
    });
  }

  // Erro de validação (Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: {
        message: 'Dados de entrada inválidos',
        status: 400,
        code: 'VALIDATION_ERROR',
        details: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      }
    });
  }

  // Erro do Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: {
        message: 'Erro de validação',
        status: 400,
        code: 'SEQUELIZE_VALIDATION_ERROR',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: {
        message: 'Registro já existe',
        status: 409,
        code: 'DUPLICATE_ENTRY',
        details: {
          field: err.errors[0]?.path,
          message: err.errors[0]?.message
        }
      }
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: {
        message: 'Referência inválida',
        status: 400,
        code: 'FOREIGN_KEY_ERROR',
        details: err.message
      }
    });
  }

  // Erro JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Token inválido',
        status: 401,
        code: 'INVALID_TOKEN'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Token expirado',
        status: 401,
        code: 'TOKEN_EXPIRED'
      }
    });
  }

  // Erro AppError customizado
  if (err instanceof AppError || err.isOperational) {
    return res.status(err.statusCode || 500).json(err.toJSON ? err.toJSON() : {
      error: {
        message: err.message || 'Erro na requisição',
        status: err.statusCode || 500,
        code: err.code || 'INTERNAL_SERVER_ERROR',
        ...(err.details && { details: err.details })
      }
    });
  }

  // Erro customizado com status code (compatibilidade com código existente)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message || 'Erro na requisição',
        status: err.statusCode,
        code: err.code || 'UNKNOWN_ERROR',
        ...(err.details && { details: err.details })
      }
    });
  }

  // Erro padrão - usar status já calculado
  const message = err.message || 'Erro interno do servidor';

  // Stack trace NUNCA deve ser exposto em resposta HTTP
  // Está sendo logado na linha 13 acima, então já está registrado nos logs
  res.status(status).json({
    error: {
      message,
      status,
      code: err.code || 'INTERNAL_SERVER_ERROR'
    }
  });
};

/**
 * Middleware para capturar erros 404 (rota não encontrada)
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: {
      message: `Rota ${req.method} ${req.path} não encontrada`,
      status: 404,
      code: 'ROUTE_NOT_FOUND'
    }
  });
};

export default {
  globalErrorHandler,
  notFoundHandler
};

