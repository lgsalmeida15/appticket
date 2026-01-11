import * as yup from 'yup';

export const criarUsuarioSchema = yup.object({
  nome: yup
    .string()
    .required('O nome é obrigatório')
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(100, 'O nome não pode exceder 100 caracteres'),
  
  email: yup
    .string()
    .required('O e-mail é obrigatório')
    .email('E-mail inválido')
    .max(255, 'O e-mail não pode exceder 255 caracteres'),
  
  senha: yup
    .string()
    .required('A senha é obrigatória')
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .max(100, 'A senha não pode exceder 100 caracteres'),
  
  tipo: yup
    .string()
    .required('O tipo é obrigatório')
    .oneOf(['admin', 'gerente', 'agente', 'usuario'], 'Tipo inválido')
});

export const cadastroSchema = yup.object({
  nome: yup
    .string()
    .required('O nome é obrigatório')
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(100, 'O nome não pode exceder 100 caracteres'),
  
  email: yup
    .string()
    .required('O e-mail é obrigatório')
    .email('E-mail inválido')
    .max(255, 'O e-mail não pode exceder 255 caracteres'),
  
  password: yup
    .string()
    .required('A senha é obrigatória')
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .max(100, 'A senha não pode exceder 100 caracteres'),
  
  confirmPassword: yup
    .string()
    .required('A confirmação de senha é obrigatória')
    .oneOf([yup.ref('password')], 'As senhas não conferem')
});

export const atualizarUsuarioSchema = yup.object({
  nome: yup
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(100, 'O nome não pode exceder 100 caracteres'),
  
  email: yup
    .string()
    .email('E-mail inválido')
    .max(255, 'O e-mail não pode exceder 255 caracteres'),
  
  senha: yup
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .max(100, 'A senha não pode exceder 100 caracteres')
    .nullable(),
  
  tipo: yup
    .string()
    .oneOf(['admin', 'gerente', 'agente', 'usuario'], 'Tipo inválido')
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .required('O e-mail é obrigatório')
    .email('E-mail inválido'),
  
  password: yup
    .string()
    .required('A senha é obrigatória')
    .min(1, 'A senha é obrigatória')
});

