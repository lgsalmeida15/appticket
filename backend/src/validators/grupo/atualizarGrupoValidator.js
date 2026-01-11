import { z } from 'zod';
import { validate } from '../index.js';

const atualizarGrupoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  descricao: z.string().optional(),
  ativo: z.boolean().optional(),
  solicitante: z.boolean().optional(),
  executor: z.boolean().optional(),
  webhook_url: z.string().url('URL do webhook inválida').optional().nullable(),
  webhook_eventos: z.array(z.string()).optional()
});

export const atualizarGrupoValidator = validate(atualizarGrupoSchema, 'body');

