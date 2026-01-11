import { z } from 'zod';
import { validate } from '../index.js';

const idsParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número').transform(Number).pipe(z.number().int().positive('ID inválido')),
  grupoId: z.string().regex(/^\d+$/, 'ID do grupo deve ser um número').transform(Number).pipe(z.number().int().positive('ID do grupo inválido'))
});

export const idsParamsValidator = validate(idsParamsSchema, 'params');

