import { z } from 'zod';
import { validate } from '../index.js';
import path from 'path';

const atualizarChamadoSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200, 'Título deve ter no máximo 200 caracteres').optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória').optional(),
  tipo: z.enum(['incidente', 'requisicao', 'problema', 'mudanca']).optional(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
  status: z.enum(['novo', 'em_andamento', 'aguardando', 'cancelado']).optional(),
  atribuido_a: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    },
    z.number().int().positive().nullable().optional()
  ),
  prazo: z.preprocess(
    (val) => {
      if (!val || val === '' || val === 'null' || val === 'undefined') return null;
      if (typeof val === 'string') {
        const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
        if (datetimeLocalRegex.test(val)) {
          return `${val}:00Z`;
        }
      }
      return val;
    },
    z.string().datetime().nullable().optional()
  ),
  tags: z.array(z.string()).optional(),
  campos_customizados: z.record(z.any()).optional(),
  grupo_id: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().int().positive().optional()
  ),
  grupo_executor_id: z.preprocess(
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
  )
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'Pelo menos um campo deve ser fornecido para atualização'
  }
);

export const atualizarChamadoValidator = async (req, res, next) => {
  try {
    // Processar arquivos se existirem (multer já fez o upload)
    if (req.files && req.files.length > 0) {
      // Inicializar campos_customizados se não existir
      if (!req.body.campos_customizados) {
        req.body.campos_customizados = {};
      }
      
      // Se for string, tentar fazer parse
      if (typeof req.body.campos_customizados === 'string') {
        try {
          req.body.campos_customizados = JSON.parse(req.body.campos_customizados);
        } catch (e) {
          req.body.campos_customizados = {};
        }
      }
      
      // Processar os arquivos enviados
      const anexosProcessados = req.files.map(file => {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return {
          nome: file.originalname,
          url: `${baseUrl}/uploads/${file.filename}`,
          tipo: file.mimetype,
          tamanho: file.size
        };
      });
      
      // Mesclar anexos novos com existentes (se houver)
      if (!req.body.campos_customizados.anexos) {
        req.body.campos_customizados.anexos = [];
      }
      
      // Se anexos for string, fazer parse
      if (typeof req.body.campos_customizados.anexos === 'string') {
        try {
          req.body.campos_customizados.anexos = JSON.parse(req.body.campos_customizados.anexos);
        } catch (e) {
          req.body.campos_customizados.anexos = [];
        }
      }
      
      // Adicionar novos anexos
      req.body.campos_customizados.anexos = [
        ...req.body.campos_customizados.anexos,
        ...anexosProcessados
      ];
    }
    
    // Validar com o schema
    await validate(atualizarChamadoSchema, 'body')(req, res, next);
  } catch (error) {
    next(error);
  }
};

