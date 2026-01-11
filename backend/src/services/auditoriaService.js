import historicoAuditoriaRepository from '../repositories/historicoAuditoriaRepository.js';
import logger from '../utils/logger.js';

/**
 * Service de auditoria
 * Responsável por registrar todas as ações importantes do sistema
 */
class AuditoriaService {
  /**
   * Extrair informações do request
   * @private
   */
  _extrairInfoRequest(req) {
    return {
      ip_address: req.ip || req.connection?.remoteAddress || null,
      user_agent: req.get('user-agent') || null
    };
  }

  /**
   * Registrar criação de entidade
   */
  async registrarCriacao(usuarioId, entidade, entidadeId, dados, req = null) {
    try {
      const infoRequest = req ? this._extrairInfoRequest(req) : {};

      const registro = await historicoAuditoriaRepository.criar({
        usuario_id: usuarioId,
        entidade,
        entidade_id: entidadeId,
        acao: 'criacao',
        dados_anteriores: null,
        dados_novos: dados,
        ip_address: infoRequest.ip_address,
        user_agent: infoRequest.user_agent,
        data: new Date()
      });

      logger.info('Auditoria: criação registrada', {
        entidade,
        entidadeId,
        usuarioId
      });

      return registro.toJSON ? registro.toJSON() : registro;
    } catch (error) {
      logger.error('Erro ao registrar auditoria de criação', {
        error: error.message,
        entidade,
        entidadeId
      });
      // Não lançar erro para não quebrar o fluxo principal
      return null;
    }
  }

  /**
   * Registrar atualização de entidade
   */
  async registrarAtualizacao(usuarioId, entidade, entidadeId, dadosAnteriores, dadosNovos, req = null) {
    try {
      const infoRequest = req ? this._extrairInfoRequest(req) : {};

      const registro = await historicoAuditoriaRepository.criar({
        usuario_id: usuarioId,
        entidade,
        entidade_id: entidadeId,
        acao: 'atualizacao',
        dados_anteriores: dadosAnteriores,
        dados_novos: dadosNovos,
        ip_address: infoRequest.ip_address,
        user_agent: infoRequest.user_agent,
        data: new Date()
      });

      logger.info('Auditoria: atualização registrada', {
        entidade,
        entidadeId,
        usuarioId
      });

      return registro.toJSON ? registro.toJSON() : registro;
    } catch (error) {
      logger.error('Erro ao registrar auditoria de atualização', {
        error: error.message,
        entidade,
        entidadeId
      });
      return null;
    }
  }

  /**
   * Registrar exclusão de entidade
   */
  async registrarExclusao(usuarioId, entidade, entidadeId, dados, req = null) {
    try {
      const infoRequest = req ? this._extrairInfoRequest(req) : {};

      const registro = await historicoAuditoriaRepository.criar({
        usuario_id: usuarioId,
        entidade,
        entidade_id: entidadeId,
        acao: 'exclusao',
        dados_anteriores: dados,
        dados_novos: null,
        ip_address: infoRequest.ip_address,
        user_agent: infoRequest.user_agent,
        data: new Date()
      });

      logger.info('Auditoria: exclusão registrada', {
        entidade,
        entidadeId,
        usuarioId
      });

      return registro.toJSON ? registro.toJSON() : registro;
    } catch (error) {
      logger.error('Erro ao registrar auditoria de exclusão', {
        error: error.message,
        entidade,
        entidadeId
      });
      return null;
    }
  }

  /**
   * Registrar login
   */
  async registrarLogin(usuarioId, req) {
    try {
      const infoRequest = this._extrairInfoRequest(req);

      const registro = await historicoAuditoriaRepository.criar({
        usuario_id: usuarioId,
        entidade: 'usuario',
        entidade_id: usuarioId,
        acao: 'login',
        dados_anteriores: null,
        dados_novos: { timestamp: new Date().toISOString() },
        ip_address: infoRequest.ip_address,
        user_agent: infoRequest.user_agent,
        data: new Date()
      });

      logger.info('Auditoria: login registrado', {
        usuarioId,
        ip: infoRequest.ip_address
      });

      return registro.toJSON ? registro.toJSON() : registro;
    } catch (error) {
      logger.error('Erro ao registrar auditoria de login', {
        error: error.message,
        usuarioId
      });
      return null;
    }
  }

  /**
   * Registrar logout
   */
  async registrarLogout(usuarioId, req) {
    try {
      const infoRequest = this._extrairInfoRequest(req);

      const registro = await historicoAuditoriaRepository.criar({
        usuario_id: usuarioId,
        entidade: 'usuario',
        entidade_id: usuarioId,
        acao: 'logout',
        dados_anteriores: null,
        dados_novos: { timestamp: new Date().toISOString() },
        ip_address: infoRequest.ip_address,
        user_agent: infoRequest.user_agent,
        data: new Date()
      });

      logger.info('Auditoria: logout registrado', {
        usuarioId
      });

      return registro.toJSON ? registro.toJSON() : registro;
    } catch (error) {
      logger.error('Erro ao registrar auditoria de logout', {
        error: error.message,
        usuarioId
      });
      return null;
    }
  }

  /**
   * Registrar tentativa de login falhada
   */
  async registrarLoginFalhado(email, motivo, req) {
    try {
      const infoRequest = this._extrairInfoRequest(req);

      // Não temos usuario_id ainda, então usamos null
      const registro = await historicoAuditoriaRepository.criar({
        usuario_id: null, // NULL para ações sem usuário autenticado
        entidade: 'auth',
        entidade_id: 0,
        acao: 'login_falhado',
        dados_anteriores: null,
        dados_novos: {
          email,
          motivo,
          timestamp: new Date().toISOString()
        },
        ip_address: infoRequest.ip_address,
        user_agent: infoRequest.user_agent,
        data: new Date()
      });

      logger.warn('Auditoria: login falhado registrado', {
        email,
        motivo,
        ip: infoRequest.ip_address
      });

      return registro.toJSON ? registro.toJSON() : registro;
    } catch (error) {
      logger.error('Erro ao registrar auditoria de login falhado', {
        error: error.message,
        email
      });
      return null;
    }
  }

  /**
   * Registrar erro crítico
   */
  async registrarErroCritico(usuarioId, erro, req = null) {
    try {
      const infoRequest = req ? this._extrairInfoRequest(req) : {};

      const registro = await historicoAuditoriaRepository.criar({
        usuario_id: usuarioId || 0,
        entidade: 'sistema',
        entidade_id: 0,
        acao: 'erro_critico',
        dados_anteriores: null,
        dados_novos: {
          erro: erro.message || erro.toString(),
          stack: erro.stack || null,
          timestamp: new Date().toISOString()
        },
        ip_address: infoRequest.ip_address,
        user_agent: infoRequest.user_agent,
        data: new Date()
      });

      logger.error('Auditoria: erro crítico registrado', {
        usuarioId,
        erro: erro.message
      });

      return registro.toJSON ? registro.toJSON() : registro;
    } catch (error) {
      logger.error('Erro ao registrar auditoria de erro crítico', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Buscar histórico de auditoria
   */
  async buscarHistorico(filtros = {}, paginacao = {}) {
    return await historicoAuditoriaRepository.listar(filtros, paginacao);
  }

  /**
   * Buscar histórico por entidade
   */
  async buscarPorEntidade(entidade, entidadeId, opcoes = {}) {
    const registros = await historicoAuditoriaRepository.buscarPorEntidade(entidade, entidadeId, opcoes);
    return registros.map(r => r.toJSON ? r.toJSON() : r);
  }

  /**
   * Buscar histórico por usuário
   */
  async buscarPorUsuario(usuarioId, opcoes = {}) {
    const registros = await historicoAuditoriaRepository.buscarPorUsuario(usuarioId, opcoes);
    return registros.map(r => r.toJSON ? r.toJSON() : r);
  }
}

export default new AuditoriaService();

