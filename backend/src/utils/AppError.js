/**
 * Classe de erro customizada para padronizar erros da aplicação
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code || this._generateErrorCode(statusCode);
    this.details = details;
    this.isOperational = true; // Erro operacional (conhecido), não bug
    
    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Gerar código de erro baseado no status code
   * @private
   */
  _generateErrorCode(statusCode) {
    const codes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE'
    };
    return codes[statusCode] || 'UNKNOWN_ERROR';
  }

  /**
   * Converter erro para formato JSON padronizado
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        status: this.statusCode,
        ...(this.details && { details: this.details })
      }
    };
  }
}

export default AppError;

