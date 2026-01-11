import * as yup from 'yup';

export const criarComentarioSchema = yup.object({
  texto: yup
    .string()
    .required('O comentário é obrigatório')
    .min(1, 'O comentário não pode estar vazio')
    .max(5000, 'O comentário não pode exceder 5000 caracteres'),
  
  interno: yup
    .boolean()
    .default(false)
});

