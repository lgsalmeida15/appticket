import { z } from 'zod';
import { validate } from '../index.js';

const criarUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  tipo: z.enum(['admin', 'gerente', 'agente']).optional().default('agente'),
  ativo: z.coerce.boolean().optional().default(true)
});

export const criarUsuarioValidator = validate(criarUsuarioSchema, 'body');

