import { configure } from 'vee-validate';

// Configurar VeeValidate para usar Yup
configure({
  validateOnBlur: true,
  validateOnChange: true,
  validateOnInput: false,
  validateOnModelUpdate: true,
});

export default {
  install(app) {
    // Plugin instalado globalmente
    // VeeValidate com Yup está configurado
  }
};

