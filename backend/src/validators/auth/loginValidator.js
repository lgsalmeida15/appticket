import { z } from 'zod';
import { validate } from '../index.js';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export const loginValidator = validate(loginSchema, 'body');

