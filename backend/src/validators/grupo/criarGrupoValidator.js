import { z } from 'zod';
import { validate } from '../index.js';

const criarGrupoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  descricao: z.string().optional(),
  ativo: z.boolean().optional(),
  solicitante: z.boolean().optional(),
  executor: z.boolean().optional(),
  webhook_url: z.string()
    .transform(val => val === '' ? null : val)
    .refine(val => val === null || z.string().url().safeParse(val).success, {
      message: 'URL do webhook inválida'
    })
    .optional()
    .nullable(),
  webhook_eventos: z.array(z.string()).optional()
});

export const criarGrupoValidator = validate(criarGrupoSchema, 'body');

