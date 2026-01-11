import Grupo from '../models/Grupo.js';
import Usuario from '../models/Usuario.js';
import UsuarioGrupo from '../models/UsuarioGrupo.js';
import { Op } from 'sequelize';

/**
 * Repository para operações de banco de dados relacionadas a grupos
 * Isola acesso direto ao Sequelize
 */
class GrupoRepository {
  /**
   * Criar novo grupo
   */
  async criar(dados) {
    return await Grupo.create(dados);
  }

  /**
   * Buscar grupo por ID
   */
  async buscarPorId(id, opcoes = {}) {
    const include = [];
    
    if (opcoes.incluirUsuarios) {
      include.push({
        model: Usuario,
        as: 'usuarios',
        through: {
          attributes: ['papel', 'ativo']
        },
        attributes: ['id', 'nome', 'email', 'tipo']
      });
    }

    return await Grupo.findByPk(id, { include });
  }

  /**
   * Listar grupos
   */
  async listar(filtros = {}, paginacao = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      ativo,
      executor,
      solicitante,
      whereCustom
    } = filtros;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${search}%` } },
        { descricao: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (ativo !== undefined) where.ativo = ativo;
    
    // ✅ Filtrar por grupos executores
    if (executor !== undefined) where.executor = executor;
    
    // ✅ Filtrar por grupos solicitantes
    if (solicitante !== undefined) where.solicitante = solicitante;
    
    if (whereCustom) {
      Object.assign(where, whereCustom);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Grupo.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nome', 'ASC']],
      include: [
        {
          model: Usuario,
          as: 'usuarios',
          through: {
            attributes: ['papel', 'ativo']
          },
          attributes: ['id', 'nome', 'email']
        }
      ]
    });

    return {
      grupos: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Atualizar grupo
   */
  async atualizar(id, dados) {
    const grupo = await Grupo.findByPk(id);
    if (!grupo) {
      return null;
    }
    
    await grupo.update(dados);
    return grupo;
  }

  /**
   * Deletar grupo (soft delete)
   */
  async deletar(id) {
    const grupo = await Grupo.findByPk(id);
    if (!grupo) {
      return null;
    }
    
    await grupo.update({ ativo: false });
    return grupo;
  }

  /**
   * Verificar dependências antes de deletar grupo permanentemente
   * Retorna objeto com contadores de dependências
   */
  async verificarDependencias(id) {
    const { Chamado } = await import('../models/index.js');
    
    const chamados = await Chamado.count({ where: { grupo_id: id } });

    return {
      chamados,
      total: chamados
    };
  }

  /**
   * Deletar grupo permanentemente (hard delete)
   * Só é possível se não houver chamados (RESTRICT)
   * UsuarioGrupo, SLA e WebhookLog serão deletados automaticamente (CASCADE)
   */
  async deletarPermanente(id) {
    const grupo = await Grupo.findByPk(id);
    if (!grupo) {
      return null;
    }
    
    // Destroy vai falhar se houver chamados com RESTRICT
    // UsuarioGrupo, SLA e WebhookLog serão deletados automaticamente (CASCADE)
    await grupo.destroy();
    return grupo;
  }

  /**
   * Buscar todos os grupos ativos
   */
  async buscarAtivos(opcoes = {}) {
    return await Grupo.findAll({
      where: { ativo: true },
      order: [['nome', 'ASC']],
      ...opcoes
    });
  }

  /**
   * Buscar grupos de um usuário
   */
  async buscarPorUsuario(usuarioId, opcoes = {}) {
    const gruposUsuario = await UsuarioGrupo.findAll({
      where: { 
        usuario_id: usuarioId,
        ativo: true
      },
      include: [{
        model: Grupo,
        as: 'grupo',
        where: { ativo: true },
        required: true, // Garantir que apenas grupos existentes e ativos sejam retornados
        include: opcoes.incluirUsuarios ? [{
          model: Usuario,
          as: 'usuarios',
          through: {
            where: { ativo: true }, // Apenas usuários com associação ativa
            attributes: ['papel', 'ativo']
          },
          attributes: ['id', 'nome', 'email']
        }] : []
      }]
    });

    // Filtrar grupos nulos e retornar apenas grupos válidos
    return gruposUsuario
      .map(ug => ug.grupo)
      .filter(grupo => grupo !== null && grupo !== undefined);
  }

  /**
   * Adicionar usuário ao grupo
   */
  async adicionarUsuario(grupoId, usuarioId, papel = 'agente') {
    const [usuarioGrupo, created] = await UsuarioGrupo.findOrCreate({
      where: { grupo_id: grupoId, usuario_id: usuarioId },
      defaults: { papel, ativo: true }
    });

    if (!created) {
      await usuarioGrupo.update({ papel, ativo: true });
    }

    return usuarioGrupo;
  }

  /**
   * Remover usuário do grupo
   */
  async removerUsuario(grupoId, usuarioId) {
    const usuarioGrupo = await UsuarioGrupo.findOne({
      where: { grupo_id: grupoId, usuario_id: usuarioId }
    });

    if (usuarioGrupo) {
      await usuarioGrupo.update({ ativo: false });
      return true;
    }

    return false;
  }

  /**
   * Atualizar papel do usuário no grupo
   */
  async atualizarPapelUsuario(grupoId, usuarioId, papel) {
    const usuarioGrupo = await UsuarioGrupo.findOne({
      where: { grupo_id: grupoId, usuario_id: usuarioId }
    });

    if (usuarioGrupo) {
      await usuarioGrupo.update({ papel });
      return usuarioGrupo;
    }

    return null;
  }

  /**
   * Verificar se usuário pertence ao grupo
   */
  async usuarioPertenceAoGrupo(usuarioId, grupoId) {
    const count = await UsuarioGrupo.count({
      where: {
        usuario_id: usuarioId,
        grupo_id: grupoId,
        ativo: true
      }
    });

    return count > 0;
  }

  /**
   * Buscar papel do usuário no grupo
   */
  async buscarPapelDoUsuario(usuarioId, grupoId) {
    const usuarioGrupo = await UsuarioGrupo.findOne({
      where: {
        usuario_id: usuarioId,
        grupo_id: grupoId,
        ativo: true
      }
    });

    return usuarioGrupo ? usuarioGrupo.papel : null;
  }

  /**
   * Contar total de grupos
   */
  async contarTotal(filtros = {}) {
    const { whereCustom } = filtros;
    return await Grupo.count({ where: whereCustom || {} });
  }
}

export default new GrupoRepository();

