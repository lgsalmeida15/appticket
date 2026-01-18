import { z } from 'zod';
import { validate } from '../index.js';

const criarChamadoSchema = z.object({
  titulo: z.string({ required_error: 'Título é obrigatório' })
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  descricao: z.string({ required_error: 'Descrição é obrigatória' })
    .min(1, 'Descrição é obrigatória'),
  tipo: z.enum(['incidente', 'requisicao', 'problema', 'mudanca'], {
    errorMap: () => ({ message: 'Tipo inválido. Use: incidente, requisicao, problema ou mudanca' })
  }).optional().default('incidente'),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente'], {
    errorMap: () => ({ message: 'Prioridade inválida. Use: baixa, media, alta ou urgente' })
  }).optional().default('media'),
  grupo_id: z.preprocess(
    (val) => {
      // Se for string vazia ou undefined, retornar undefined para trigger required
      if (val === '' || val === null || val === undefined) return undefined;
      // Converter para número
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z.number({
      required_error: 'ID do grupo é obrigatório',
      invalid_type_error: 'ID do grupo deve ser um número'
    })
    .int('ID do grupo deve ser um número inteiro')
    .positive('ID do grupo inválido')
  ),
  grupo_executor_id: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    },
    z.number().int().positive().nullable().optional()
  ),
  atribuido_a: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    },
    z.number().int().positive().nullable().optional()
  ),
  solicitante_id: z.preprocess(
    (val) => {
      // Se for string vazia ou undefined, retornar undefined para campo opcional
      if (val === '' || val === null || val === undefined) return undefined;
      // Converter para número
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z.number({
      invalid_type_error: 'solicitante_id deve ser um número'
    })
    .int('solicitante_id deve ser um número inteiro')
    .positive('solicitante_id deve ser um número positivo')
    .optional()
  ),
  prazo: z.preprocess(
    (val) => {
      if (!val || val === '' || val === 'null' || val === 'undefined') return null;
      // Se for string no formato datetime-local (YYYY-MM-DDTHH:mm), converter para ISO
      if (typeof val === 'string') {
        // Formato datetime-local: YYYY-MM-DDTHH:mm
        const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
        if (datetimeLocalRegex.test(val)) {
          // Adicionar segundos e timezone para formato ISO
          return `${val}:00Z`;
        }
      }
      return val;
    },
    z.string().datetime().nullable().optional()
  ),
  tags: z.array(z.string()).optional(),
  campos_customizados: z.record(z.any()).optional(),
  data_hora_inicio: z.preprocess(
    (val) => {
      if (!val || val === '' || val === 'null' || val === 'undefined') return undefined;
      // Se for string no formato datetime-local (YYYY-MM-DDTHH:mm), converter para ISO
      if (typeof val === 'string') {
        // Formato datetime-local: YYYY-MM-DDTHH:mm
        const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
        if (datetimeLocalRegex.test(val)) {
          // Adicionar segundos e timezone para formato ISO
          return `${val}:00Z`;
        }
      }
      return val;
    },
    z.string().datetime().optional()
  )
});

export const criarChamadoValidator = validate(criarChamadoSchema, 'body');

