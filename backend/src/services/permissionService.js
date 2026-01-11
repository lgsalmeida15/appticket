import { Op } from 'sequelize';
import UsuarioGrupo from '../models/UsuarioGrupo.js';

/**
 * Service de Permissões
 * Centraliza toda lógica de verificação e aplicação de permissões baseadas em grupos
 */
class PermissionService {
  /**
   * Aplicar filtros de permissão baseados em grupos do usuário
   * @param {Object} usuarioLogado - Usuário autenticado
   * @returns {Object} Objeto where para Sequelize com filtros de permissão
   */
  async aplicarFiltrosPermissaoChamados(usuarioLogado) {
    // Admin vê todos os chamados
    if (usuarioLogado.tipo === 'admin') {
      return {};
    }

    // Buscar grupos do usuário
    const gruposUsuario = await UsuarioGrupo.findAll({
      where: {
        usuario_id: usuarioLogado.id,
        ativo: true
      },
      attributes: ['grupo_id', 'papel']
    });

    if (gruposUsuario.length === 0) {
      // Usuário não pertence a nenhum grupo
      // Agente sem grupo só vê chamados que criou ou está atribuído
      if (usuarioLogado.tipo === 'agente') {
        return {
          [Op.or]: [
            { usuario_id: usuarioLogado.id },
            { atribuido_a: usuarioLogado.id }
          ]
        };
      }
      // Gerente sem grupo não vê nenhum chamado
      return { id: -1 };
    }

    const gruposIds = gruposUsuario.map(ug => ug.grupo_id);

    // Gerentes veem todos os chamados dos grupos que gerenciam
    if (usuarioLogado.tipo === 'gerente') {
      const gruposGerenciados = gruposUsuario
        .filter(ug => ug.papel === 'gerente')
        .map(ug => ug.grupo_id);

      if (gruposGerenciados.length > 0) {
        return { grupo_id: { [Op.in]: gruposGerenciados } };
      } else {
        // Gerente sem grupos gerenciados não vê nenhum chamado
        return { id: -1 };
      }
    }

    // ✅ AGENTES: Só veem chamados que criaram OU estão atribuídos a eles
    if (usuarioLogado.tipo === 'agente') {
      return {
        [Op.or]: [
          { usuario_id: usuarioLogado.id },
          { atribuido_a: usuarioLogado.id }
        ]
      };
    }

    // Fallback: não vê nenhum chamado
    return { id: -1 };
  }

  /**
   * Verificar se usuário tem permissão para visualizar um chamado específico
   * @param {Object} chamado - Chamado a ser verificado
   * @param {Object} usuarioLogado - Usuário autenticado
   * @throws {Error} Se usuário não tem permissão
   */
  async verificarPermissaoVisualizacaoChamado(chamado, usuarioLogado) {
    // Admin vê todos
    if (usuarioLogado.tipo === 'admin') {
      return true;
    }

    // Agente só vê se criou ou está atribuído
    if (usuarioLogado.tipo === 'agente') {
      const podeVer = chamado.usuario_id === usuarioLogado.id || chamado.atribuido_a === usuarioLogado.id;
      if (!podeVer) {
        const error = new Error('Você não tem permissão para visualizar este chamado');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }
      return true;
    }

    // Gerente vê todos os chamados dos grupos que gerencia
    if (usuarioLogado.tipo === 'gerente') {
      const gruposUsuario = await UsuarioGrupo.findAll({
        where: {
          usuario_id: usuarioLogado.id,
          ativo: true
        },
        attributes: ['grupo_id', 'papel']
      });

      const gruposGerenciados = gruposUsuario
        .filter(ug => ug.papel === 'gerente')
        .map(ug => ug.grupo_id);

      const podeVer = gruposGerenciados.includes(chamado.grupo_id);
      if (!podeVer) {
        const error = new Error('Você não tem permissão para visualizar este chamado');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }
      return true;
    }

    // Se não é nenhum dos tipos acima, não tem permissão
    const error = new Error('Você não tem permissão para visualizar este chamado');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  /**
   * Verificar se usuário é admin
   * @param {Object} usuario - Usuário a verificar
   * @returns {Boolean}
   */
  isAdmin(usuario) {
    return usuario?.tipo === 'admin';
  }

  /**
   * Verificar se usuário é gerente ou admin
   * @param {Object} usuario - Usuário a verificar
   * @returns {Boolean}
   */
  isGerenteOuAdmin(usuario) {
    return usuario?.tipo === 'gerente' || usuario?.tipo === 'admin';
  }

  /**
   * Verificar se usuário pode gerenciar chamado
   * @param {Object} usuario - Usuário a verificar
   * @returns {Boolean}
   */
  podeGerenciarChamado(usuario) {
    return this.isAdmin(usuario) || usuario?.tipo === 'gerente';
  }

  /**
   * Verificar se usuário pertence a um grupo específico
   * @param {Number} usuarioId - ID do usuário
   * @param {Number} grupoId - ID do grupo
   * @returns {Boolean}
   */
  async usuarioPertenceAoGrupo(usuarioId, grupoId) {
    const associacao = await UsuarioGrupo.findOne({
      where: {
        usuario_id: usuarioId,
        grupo_id: grupoId,
        ativo: true
      }
    });
    return !!associacao;
  }

  /**
   * Verificar se grupo está ativo
   * @param {Object} grupo - Grupo a verificar
   * @returns {Boolean}
   */
  grupoEstaAtivo(grupo) {
    return grupo && grupo.ativo !== false;
  }

  /**
   * Verificar se usuário pode alterar campos administrativos de chamado
   * @param {Object} usuario - Usuário a verificar
   * @param {Array} camposAdministrativos - Campos que estão sendo alterados
   * @returns {Boolean}
   */
  podeAlterarCamposAdministrativos(usuario, camposAdministrativos = []) {
    const camposAdmin = ['tipo', 'prioridade', 'status', 'atribuido_a'];
    const temCampoAdministrativo = camposAdministrativos.some(campo => camposAdmin.includes(campo));
    
    if (temCampoAdministrativo && usuario.tipo !== 'admin') {
      return false;
    }
    
    return true;
  }
}

export default new PermissionService();


