import authService from '../services/authService.js';

/**
 * Cadastro de novo usuário
 */
export const register = async (req, res, next) => {
  try {
    // Validação obrigatória - validator sempre deve executar
    if (!req.validatedData) {
      const error = new Error('Dados não validados');
      error.statusCode = 400;
      error.code = 'VALIDATION_REQUIRED';
      throw error;
    }
    const dados = req.validatedData;
    
    const resultado = await authService.registrar(dados);

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      ...resultado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login de usuário
 */
export const login = async (req, res, next) => {
  try {
    // Validação obrigatória - validator sempre deve executar
    if (!req.validatedData) {
      const error = new Error('Dados não validados');
      error.statusCode = 400;
      error.code = 'VALIDATION_REQUIRED';
      throw error;
    }
    const { email, password } = req.validatedData;
    
    const resultado = await authService.login(email, password, req);

    res.json({
      message: 'Login realizado com sucesso',
      ...resultado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter dados do usuário autenticado
 */
export const me = async (req, res, next) => {
  try {
    const user = await authService.obterUsuarioAutenticado(req.usuario.id);

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (invalidar token)
 */
export const logout = async (req, res, next) => {
  try {
    const resultado = await authService.logout(req.usuario.id, req);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * Alterar senha do usuário autenticado
 */
export const changePassword = async (req, res, next) => {
  try {
    // Validação obrigatória - validator sempre deve executar
    if (!req.validatedData) {
      const error = new Error('Dados não validados');
      error.statusCode = 400;
      error.code = 'VALIDATION_REQUIRED';
      throw error;
    }
    const { currentPassword, newPassword } = req.validatedData;
    
    const resultado = await authService.alterarSenha(req.usuario.id, currentPassword, newPassword, req);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  me,
  logout,
  changePassword
};
