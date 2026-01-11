/**
 * Configuração global para testes
 */
import dotenv from 'dotenv';

// Carregar variáveis de ambiente de teste
dotenv.config({ path: '.env.test' });

// Configurar timezone para testes
process.env.TZ = 'UTC';

// Mockar logger para não poluir saída dos testes
jest.mock('../../src/utils/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

export default {};

