import * as yup from 'yup';

export const criarChamadoSchema = yup.object({
  titulo: yup
    .string()
    .required('O título é obrigatório')
    .min(5, 'O título deve ter pelo menos 5 caracteres')
    .max(255, 'O título não pode exceder 255 caracteres'),
  
  descricao: yup
    .string()
    .required('A descrição é obrigatória')
    .min(3, 'A descrição deve ter pelo menos 3 caracteres'),
  
  grupo_id: yup
    .number()
    .typeError('Selecione um grupo válido')
    .required('O grupo é obrigatório')
    .positive('Selecione um grupo válido')
    .transform((value, originalValue) => {
      // Converter string vazia para undefined para que o required funcione
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      const num = Number(originalValue);
      return isNaN(num) ? originalValue : num;
    }),
  
  tipo: yup
    .string()
    .required('O tipo é obrigatório')
    .oneOf(['incidente', 'requisicao', 'problema', 'mudanca'], 'Tipo inválido'),
  
  prioridade: yup
    .string()
    .required('A prioridade é obrigatória')
    .oneOf(['baixa', 'media', 'alta', 'urgente'], 'Prioridade inválida'),
  
  solicitante_id: yup
    .number()
    .nullable()
    .optional()
    .positive('Selecione um usuário válido')
    .transform((value, originalValue) => {
      // Converter string vazia, null ou undefined para undefined (opcional)
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      const num = Number(originalValue);
      return isNaN(num) ? originalValue : num;
    }),
  
  data_hora_inicio: yup
    .string()
    .nullable()
    .optional()
    .transform((value, originalValue) => {
      // Converter string vazia, null ou undefined para undefined (opcional)
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      return originalValue;
    })
});

export const editarChamadoSchema = yup.object({
  titulo: yup
    .string()
    .required('O título é obrigatório')
    .min(5, 'O título deve ter pelo menos 5 caracteres')
    .max(255, 'O título não pode exceder 255 caracteres'),
  
  descricao: yup
    .string()
    .required('A descrição é obrigatória')
    .min(3, 'A descrição deve ter pelo menos 3 caracteres'),
  
  grupo_id: yup
    .number()
    .typeError('Selecione um grupo válido')
    .required('O grupo é obrigatório')
    .positive('Selecione um grupo válido')
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      const num = Number(originalValue);
      return isNaN(num) ? originalValue : num;
    }),
  
  tipo: yup
    .string()
    .required('O tipo é obrigatório')
    .oneOf(['incidente', 'requisicao', 'problema', 'mudanca'], 'Tipo inválido'),
  
  prioridade: yup
    .string()
    .required('A prioridade é obrigatória')
    .oneOf(['baixa', 'media', 'alta', 'urgente'], 'Prioridade inválida'),
  
  solicitante_id: yup
    .number()
    .nullable()
    .optional()
    .positive('Selecione um usuário válido')
    .transform((value, originalValue) => {
      // Converter string vazia, null ou undefined para undefined (opcional)
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      const num = Number(originalValue);
      return isNaN(num) ? originalValue : num;
    }),
  
  data_hora_inicio: yup
    .string()
    .nullable()
    .optional()
    .transform((value, originalValue) => {
      // Converter string vazia, null ou undefined para undefined (opcional)
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      return originalValue;
    })
});

export const atualizarChamadoSchema = yup.object({
  status: yup
    .string()
    .oneOf(['novo', 'em_andamento', 'aguardando', 'resolvido', 'fechado', 'cancelado'], 'Status inválido'),
  
  prioridade: yup
    .string()
    .oneOf(['baixa', 'media', 'alta', 'urgente'], 'Prioridade inválida'),
  
  tipo: yup
    .string()
    .oneOf(['incidente', 'requisicao', 'problema', 'mudanca'], 'Tipo inválido'),
  
  atribuido_a: yup
    .number()
    .nullable()
    .positive('Selecione um usuário válido')
});

