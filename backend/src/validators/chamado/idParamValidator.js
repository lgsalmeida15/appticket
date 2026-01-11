import { z } from 'zod';
import { validate } from '../index.js';

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número').transform(Number).pipe(z.number().int().positive('ID inválido'))
});

export const idParamValidator = validate(idParamSchema, 'params');

