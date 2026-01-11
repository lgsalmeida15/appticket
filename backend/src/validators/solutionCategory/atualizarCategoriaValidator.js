import { body, validationResult } from 'express-validator';
import AppError from '../../utils/AppError.js';

export const atualizarCategoriaValidator = [
  body('categoria_nivel_1')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Categoria nível 1 não pode ser vazia')
    .isLength({ min: 2, max: 100 })
    .withMessage('Categoria nível 1 deve ter entre 2 e 100 caracteres'),

  body('categoria_nivel_2')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Categoria nível 2 não pode ser vazia')
    .isLength({ min: 2, max: 100 })
    .withMessage('Categoria nível 2 deve ter entre 2 e 100 caracteres'),

  body('categoria_nivel_3')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Categoria nível 3 não pode ser vazia')
    .isLength({ min: 2, max: 100 })
    .withMessage('Categoria nível 3 deve ter entre 2 e 100 caracteres'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      throw new AppError(errorMessages.join(', '), 400);
    }
    
    const validatedData = {};
    if (req.body.categoria_nivel_1) validatedData.categoria_nivel_1 = req.body.categoria_nivel_1;
    if (req.body.categoria_nivel_2) validatedData.categoria_nivel_2 = req.body.categoria_nivel_2;
    if (req.body.categoria_nivel_3) validatedData.categoria_nivel_3 = req.body.categoria_nivel_3;
    
    req.validatedData = validatedData;
    
    next();
  }
];

