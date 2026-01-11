import { body, validationResult } from 'express-validator';
import AppError from '../../utils/AppError.js';

export const criarCategoriaValidator = [
  body('categoria_nivel_1')
    .trim()
    .notEmpty()
    .withMessage('Categoria nível 1 é obrigatória')
    .isLength({ min: 2, max: 100 })
    .withMessage('Categoria nível 1 deve ter entre 2 e 100 caracteres'),

  body('categoria_nivel_2')
    .trim()
    .notEmpty()
    .withMessage('Categoria nível 2 é obrigatória')
    .isLength({ min: 2, max: 100 })
    .withMessage('Categoria nível 2 deve ter entre 2 e 100 caracteres'),

  body('categoria_nivel_3')
    .trim()
    .notEmpty()
    .withMessage('Categoria nível 3 é obrigatória')
    .isLength({ min: 2, max: 100 })
    .withMessage('Categoria nível 3 deve ter entre 2 e 100 caracteres'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      throw new AppError(errorMessages.join(', '), 400);
    }
    
    req.validatedData = {
      categoria_nivel_1: req.body.categoria_nivel_1,
      categoria_nivel_2: req.body.categoria_nivel_2,
      categoria_nivel_3: req.body.categoria_nivel_3
    };
    
    next();
  }
];

