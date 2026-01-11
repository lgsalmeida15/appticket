import { z } from 'zod';
import { validate } from '../index.js';

/**
 * Validator para rotas que precisam validar idPai e idFilho nos parâmetros
 * Ex: POST /chamados/:idPai/associar/:idFilho
 */
const associarChamadoParamsSchema = z.object({
  idPai: z.string().regex(/^\d+$/, 'ID do chamado pai deve ser um número')
    .transform(Number)
    .pipe(z.number().int().positive('ID do chamado pai inválido')),
  idFilho: z.string().regex(/^\d+$/, 'ID do chamado filho deve ser um número')
    .transform(Number)
    .pipe(z.number().int().positive('ID do chamado filho inválido'))
});

export const associarChamadoParamsValidator = validate(associarChamadoParamsSchema, 'params');

/**
 * Validator para rotas que precisam validar apenas idPai nos parâmetros
 * Ex: GET /chamados/:idPai/filhos
 */
const idPaiParamsSchema = z.object({
  idPai: z.string().regex(/^\d+$/, 'ID do chamado pai deve ser um número')
    .transform(Number)
    .pipe(z.number().int().positive('ID do chamado pai inválido'))
});

export const idPaiParamsValidator = validate(idPaiParamsSchema, 'params');

