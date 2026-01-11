import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para login (5 tentativas por 15 minutos por IP)
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas
  message: {
    error: {
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      status: 429,
      code: 'TOO_MANY_LOGIN_ATTEMPTS'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // NUNCA desabilitar rate limit em produção
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    // Pular rate limit apenas em desenvolvimento se explicitamente configurado
    return process.env.SKIP_RATE_LIMIT === 'true';
  }
});

/**
 * Rate limiter para API geral (100 requisições por 15 minutos por IP)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições
  message: {
    error: {
      message: 'Muitas requisições. Tente novamente em alguns minutos.',
      status: 429,
      code: 'TOO_MANY_REQUESTS'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // NUNCA desabilitar rate limit em produção
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    // Pular rate limit apenas em desenvolvimento se explicitamente configurado
    return process.env.SKIP_RATE_LIMIT === 'true';
  }
});

/**
 * Rate limiter para upload (20 requisições por hora por usuário)
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // máximo 20 uploads
  keyGenerator: (req) => {
    // Usar ID do usuário se autenticado, senão usar IP
    return req.usuario?.id?.toString() || req.ip;
  },
  message: {
    error: {
      message: 'Limite de uploads excedido. Tente novamente em 1 hora.',
      status: 429,
      code: 'TOO_MANY_UPLOADS'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // NUNCA desabilitar rate limit em produção
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    // Pular rate limit apenas em desenvolvimento se explicitamente configurado
    return process.env.SKIP_RATE_LIMIT === 'true';
  }
});

export default {
  loginLimiter,
  apiLimiter,
  uploadLimiter
};

