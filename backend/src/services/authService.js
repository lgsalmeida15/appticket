import usuarioRepository from '../repositories/usuarioRepository.js';
import Usuario from '../models/Usuario.js';
import Grupo from '../models/Grupo.js';
import { gerarToken } from '../config/jwt.js';
import logger from '../utils/logger.js';
import auditoriaService from './auditoriaService.js';

/**
 * Service de autenticação
 * Contém lógica de negócio para login, registro, etc
 */
class AuthService {
  /**
   * Registrar novo usuário
   */
  async registrar(dados) {
    const { nome, email, password } = dados;

    // Verificar se email já existe
    const emailExiste = await usuarioRepository.emailExiste(email);
    if (emailExiste) {
      const error = new Error('Email já está em uso');
      error.statusCode = 400;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    // Criar usuário (senha será hashada automaticamente pelo hook do model)
    const usuario = await usuarioRepository.criar({
      nome,
      email,
      senha: password,
      tipo: 'agente' // Primeiro usuário sempre é agente
    });

    // Gerar token
    const token = gerarToken({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo
    });

    logger.info('Usuário registrado com sucesso', {
      userId: usuario.id,
      email: usuario.email
    });

    return {
      token,
      user: usuario.toJSON()
    };
  }

  /**
   * Login de usuário
   */
  async login(email, password, req = null) {
    // Buscar usuário por email
    const usuario = await usuarioRepository.buscarPorEmail(email);
    
    if (!usuario) {
      // Registrar tentativa falhada
      await auditoriaService.registrarLoginFalhado(email, 'Email não encontrado', req);
      
      const error = new Error('Email ou senha incorretos');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      await auditoriaService.registrarLoginFalhado(email, 'Usuário inativo', req);
      
      const error = new Error('Usuário inativo. Entre em contato com o administrador');
      error.statusCode = 401;
      error.code = 'USER_INACTIVE';
      throw error;
    }

    // Verificar senha (usa método do model)
    const senhaValida = await usuario.verificarSenha(password);
    
    if (!senhaValida) {
      // Registrar tentativa falhada
      await auditoriaService.registrarLoginFalhado(email, 'Senha incorreta', req);
      
      const error = new Error('Email ou senha incorretos');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Atualizar último acesso
    await usuarioRepository.atualizarUltimoAcesso(usuario.id);

    // Gerar token
    const token = gerarToken({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo
    });

    // Registrar login bem-sucedido
    await auditoriaService.registrarLogin(usuario.id, req);

    logger.info('Login realizado com sucesso', {
      userId: usuario.id,
      email: usuario.email
    });

    return {
      token,
      user: usuario.toJSON()
    };
  }

  /**
   * Obter dados do usuário autenticado
   */
  async obterUsuarioAutenticado(usuarioId) {
    const usuario = await usuarioRepository.buscarPorId(usuarioId, {
      include: [{
        model: Grupo,
        as: 'grupos',
        through: {
          attributes: ['papel', 'ativo', 'id'],
          where: { ativo: true }
        },
        where: { ativo: true },
        required: false
      }]
    });
    
    if (!usuario) {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Filtrar grupos inativos caso ainda existam
    if (usuario.grupos) {
      usuario.grupos = usuario.grupos.filter(g => {
        const associacao = g.usuario_grupo || g.UsuarioGrupo;
        return associacao && associacao.ativo !== false && g.ativo !== false;
      });
    }

    return usuario.toJSON();
  }

  /**
   * Logout (invalidar token)
   * Em uma implementação real, pode adicionar token a uma blacklist
   */
  async logout(usuarioId, req = null) {
    // Registrar logout
    await auditoriaService.registrarLogout(usuarioId, req);

    logger.info('Logout realizado', {
      userId: usuarioId
    });

    return { message: 'Logout realizado com sucesso' };
  }

  /**
   * Alterar senha do usuário autenticado
   */
  async alterarSenha(usuarioId, senhaAtual, novaSenha, req = null) {
    // Buscar usuário
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    
    if (!usuario) {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Verificar senha atual
    const senhaValida = await usuario.verificarSenha(senhaAtual);
    
    if (!senhaValida) {
      const error = new Error('Senha atual incorreta');
      error.statusCode = 400;
      error.code = 'INVALID_CURRENT_PASSWORD';
      throw error;
    }

    // Atualizar senha (o hook do model fará o hash automaticamente)
    await usuarioRepository.atualizar(usuarioId, {
      senha: novaSenha
    });

    // Registrar na auditoria
    await auditoriaService.registrarAtualizacao(
      usuarioId,
      'usuario',
      usuarioId,
      { senha: '***' },
      { senha: '*** (alterada)' },
      req
    );

    logger.info('Senha alterada com sucesso', {
      userId: usuarioId
    });

    return { message: 'Senha alterada com sucesso' };
  }
}

export default new AuthService();

