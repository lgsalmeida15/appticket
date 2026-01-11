import * as yup from 'yup';

export const criarGrupoSchema = yup.object({
  nome: yup
    .string()
    .required('O nome é obrigatório')
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(100, 'O nome não pode exceder 100 caracteres'),
  
  descricao: yup
    .string()
    .max(500, 'A descrição não pode exceder 500 caracteres')
    .nullable()
});

export const atualizarGrupoSchema = yup.object({
  nome: yup
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(100, 'O nome não pode exceder 100 caracteres'),
  
  descricao: yup
    .string()
    .max(500, 'A descrição não pode exceder 500 caracteres')
    .nullable()
});

