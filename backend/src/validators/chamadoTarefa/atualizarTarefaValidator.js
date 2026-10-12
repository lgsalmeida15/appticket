import { z } from 'zod';
import { validate } from '../index.js';

const atualizarTarefaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200, 'Título deve ter no máximo 200 caracteres').optional(),
  descricao: z.string().nullable().optional(),
  status: z.enum(['pendente', 'em_andamento', 'concluida', 'cancelada']).optional(),
  responsavel_id: z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (val === '' || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    },
    z.number().int().positive().nullable().optional()
  ),
  data_inicio_prevista: z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (val === '' || val === null) return null;
      return val;
    },
    z.coerce.date().nullable().optional()
  ),
  data_fim_prevista: z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (val === '' || val === null) return null;
      return val;
    },
    z.coerce.date().nullable().optional()
  )
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Pelo menos um campo deve ser fornecido para atualização' }
).refine(
  (data) => !(data.data_inicio_prevista && data.data_fim_prevista) || data.data_fim_prevista >= data.data_inicio_prevista,
  {
    message: 'Data de fim prevista não pode ser anterior à data de início prevista',
    path: ['data_fim_prevista']
  }
);

export const atualizarTarefaValidator = validate(atualizarTarefaSchema, 'body');
