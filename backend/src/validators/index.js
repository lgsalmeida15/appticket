/**
 * Helper para criar middleware de validação com Zod
 * @param {z.ZodSchema} schema - Schema Zod para validação
 * @param {string} source - 'body' | 'query' | 'params'
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const data = source === 'body' ? req.body : 
                   source === 'query' ? req.query : 
                   req.params;

      // Log para debug (remover depois)
      if (source === 'body') {
        console.log('[Validator] Dados recebidos no body:', JSON.stringify(data, null, 2));
        console.log('[Validator] Tipos dos dados:', Object.keys(data).reduce((acc, key) => {
          acc[key] = typeof data[key];
          return acc;
        }, {}));
      }

      const validatedData = await schema.parseAsync(data);
      
      // Remover campos undefined do resultado (para query strings opcionais)
      const cleanedData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, value]) => value !== undefined)
      );
      
      // Adicionar dados validados ao request
      req.validatedData = cleanedData;
      
      // Atualizar dados originais com dados validados e limpos
      if (source === 'body') {
        req.body = cleanedData;
      } else if (source === 'query') {
        req.query = cleanedData;
      } else {
        req.params = cleanedData;
      }
      
      next();
    } catch (error) {
      // Se for erro do Zod, formatar resposta
      if (error.name === 'ZodError') {
        console.error('[Validator] Erro de validação:', error.errors);
        return res.status(400).json({
          error: {
            message: 'Dados de entrada inválidos',
            status: 400,
            code: 'VALIDATION_ERROR',
            details: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
              code: e.code
            }))
          }
        });
      }
      
      console.error('[Validator] Erro inesperado:', error);
      next(error);
    }
  };
};

export default { validate };

