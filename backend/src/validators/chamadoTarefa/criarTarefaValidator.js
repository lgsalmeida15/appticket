import { z } from 'zod';
import { validate } from '../index.js';

const criarTarefaSchema = z.object({
  titulo: z.string({ required_error: 'Título é obrigatório' })
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  descricao: z.string().optional(),
  responsavel_id: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z.number().int().positive().optional()
  ),
  data_inicio_prevista: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional()
  ),
  data_fim_prevista: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional()
  )
}).refine(
  (data) => !(data.data_inicio_prevista && data.data_fim_prevista) || data.data_fim_prevista >= data.data_inicio_prevista,
  {
    message: 'Data de fim prevista não pode ser anterior à data de início prevista',
    path: ['data_fim_prevista']
  }
);

export const criarTarefaValidator = validate(criarTarefaSchema, 'body');
