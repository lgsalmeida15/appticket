import { z } from 'zod';
import { validate } from '../index.js';

const atualizarUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  tipo: z.enum(['admin', 'gerente', 'agente']).optional(),
  ativo: z.coerce.boolean().optional()
});

export const atualizarUsuarioValidator = validate(atualizarUsuarioSchema, 'body');

