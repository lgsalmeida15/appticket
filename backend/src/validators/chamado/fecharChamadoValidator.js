import { body, validationResult } from 'express-validator';
import AppError from '../../utils/AppError.js';

export const fecharChamadoValidator = [
  body('data_hora_resolucao')
    .notEmpty()
    .withMessage('Data e hora de resolução são obrigatórias')
    .isISO8601()
    .withMessage('Data e hora de resolução inválidas'),

  body('categoria_solucao_id')
    .notEmpty()
    .withMessage('Categoria de solução é obrigatória')
    .isInt({ min: 1 })
    .withMessage('ID da categoria de solução inválido'),

  body('descricao_fechamento')
    .trim()
    .notEmpty()
    .withMessage('Descrição do fechamento é obrigatória')
    .isLength({ min: 10 })
    .withMessage('Descrição do fechamento deve ter no mínimo 10 caracteres'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      throw new AppError(errorMessages.join(', '), 400);
    }
    
    req.validatedData = {
      data_hora_resolucao: req.body.data_hora_resolucao,
      categoria_solucao_id: parseInt(req.body.categoria_solucao_id),
      descricao_fechamento: req.body.descricao_fechamento
    };
    
    next();
  }
];

