import { verificarToken, extrairToken } from '../config/jwt.js';
import Usuario from '../models/Usuario.js';

/**
 * Middleware para verificar autenticação JWT
 */
export const autenticar = async (req, res, next) => {
  try {
    // Extrair token do header
    const token = extrairToken(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Token não fornecido',
          status: 401
        }
      });
    }

    // Verificar token
    const decoded = verificarToken(token);
    
    // Validar payload do token
    if (!decoded || !decoded.id || typeof decoded.id !== 'number' || decoded.id <= 0) {
      return res.status(401).json({
        error: {
          message: 'Token inválido - payload incorreto',
          status: 401
        }
      });
    }
    
    // Buscar usuário
    const usuario = await Usuario.findByPk(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({
        error: {
          message: 'Usuário não encontrado',
          status: 401
        }
      });
    }

    if (!usuario.ativo) {
      return res.status(401).json({
        error: {
          message: 'Usuário inativo',
          status: 401
        }
      });
    }

    // Adicionar usuário ao request
    req.usuario = usuario;
    
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        message: error.message || 'Token inválido',
        status: 401
      }
    });
  }
};

/**
 * Middleware para verificar se usuário é admin
 */
export const verificarAdmin = (req, res, next) => {
  if (req.usuario.tipo !== 'admin') {
    return res.status(403).json({
      error: {
        message: 'Acesso negado. Apenas administradores',
        status: 403
      }
    });
  }
  next();
};

/**
 * Middleware para verificar se usuário é gerente ou admin
 */
export const verificarGerente = (req, res, next) => {
  if (req.usuario.tipo !== 'gerente' && req.usuario.tipo !== 'admin') {
    return res.status(403).json({
      error: {
        message: 'Acesso negado. Apenas gerentes ou administradores',
        status: 403
      }
    });
  }
  next();
};

/**
 * Middleware condicional para listar grupos
 * Permite que todos vejam grupos executores, mas restringe outros casos
 */
export const verificarGerenteOuGruposExecutores = (req, res, next) => {
  // ✅ Se está buscando grupos executores, todos os usuários autenticados podem ver
  if (req.query.executor === 'true') {
    return next();
  }
  
  // Caso contrário, apenas gerentes e admins
  if (req.usuario.tipo !== 'gerente' && req.usuario.tipo !== 'admin') {
    return res.status(403).json({
      error: {
        message: 'Acesso negado. Apenas gerentes ou administradores',
        status: 403
      }
    });
  }
  next();
};

/**
 * Middleware para verificar tipos de usuário específicos
 * @param {Array} tipos - Array com tipos permitidos
 */
export const verificarTipo = (tipos) => {
  return (req, res, next) => {
    if (!tipos.includes(req.usuario.tipo)) {
      return res.status(403).json({
        error: {
          message: 'Acesso negado. Permissão insuficiente',
          status: 403
        }
      });
    }
    next();
  };
};

export default {
  autenticar,
  verificarAdmin,
  verificarGerente,
  verificarTipo
};

