import Usuario from '../models/Usuario.js';
import Grupo from '../models/Grupo.js';
import { Op } from 'sequelize';

/**
 * Repository para operações de banco de dados relacionadas a usuários
 * Isola acesso direto ao Sequelize
 */
class UsuarioRepository {
  /**
   * Criar novo usuário
   */
  async criar(dados) {
    return await Usuario.create(dados);
  }

  /**
   * Buscar usuário por ID
   */
  async buscarPorId(id, opcoes = {}) {
    return await Usuario.findByPk(id, opcoes);
  }

  /**
   * Buscar usuário por email
   */
  async buscarPorEmail(email, opcoes = {}) {
    return await Usuario.findOne({
      where: { email },
      ...opcoes
    });
  }

  /**
   * Listar usuários
   */
  async listar(filtros = {}, paginacao = {}, opcoes = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      tipo,
      ativo,
      whereCustom
    } = filtros;

    const { incluirGrupos = false } = opcoes;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (tipo) where.tipo = tipo;
    if (ativo !== undefined) where.ativo = ativo;
    
    if (whereCustom) {
      Object.assign(where, whereCustom);
    }

    const offset = (page - 1) * limit;

    const include = [];
    
    // Incluir grupos se solicitado
    if (incluirGrupos) {
      include.push({
        model: Grupo,
        as: 'grupos',
        through: {
          where: { ativo: true }, // Apenas associações ativas
          attributes: ['papel', 'ativo', 'id']
        },
        where: { ativo: true }, // Apenas grupos ativos
        required: false
      });
    }

    const { count, rows } = await Usuario.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nome', 'ASC']],
      attributes: { exclude: ['senha'] },
      include: include.length > 0 ? include : undefined,
      distinct: true // Importante quando há includes para contar corretamente
    });

    return {
      usuarios: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Atualizar usuário
   */
  async atualizar(id, dados) {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return null;
    }
    
    await usuario.update(dados);
    return usuario;
  }

  /**
   * Deletar usuário (soft delete)
   */
  async deletar(id) {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return null;
    }
    
    await usuario.update({ ativo: false });
    return usuario;
  }

  /**
   * Verificar dependências antes de deletar usuário permanentemente
   * Retorna objeto com contadores de dependências
   */
  async verificarDependencias(id) {
    const { Chamado, Historico, Comentario, TicketTimeTracking, HistoricoAuditoria } = await import('../models/index.js');
    
    const [
      chamadosCriados,
      chamadosAtribuidos,
      historicos,
      comentarios,
      timeTracking,
      auditorias
    ] = await Promise.all([
      Chamado.count({ where: { usuario_id: id } }),
      Chamado.count({ where: { atribuido_a: id } }),
      Historico.count({ where: { usuario_id: id } }),
      Comentario.count({ where: { usuario_id: id } }),
      TicketTimeTracking.count({ where: { usuario_id: id } }),
      HistoricoAuditoria.count({ where: { usuario_id: id } })
    ]);

    return {
      chamadosCriados,
      chamadosAtribuidos,
      historicos,
      comentarios,
      timeTracking,
      auditorias,
      total: chamadosCriados + chamadosAtribuidos + historicos + comentarios + timeTracking + auditorias
    };
  }

  /**
   * Deletar usuário permanentemente (hard delete)
   * Só é possível se não houver dependências (RESTRICT)
   */
  async deletarPermanente(id) {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return null;
    }
    
    // Destroy vai falhar se houver dependências com RESTRICT
    // UsuarioGrupo será deletado automaticamente (CASCADE)
    await usuario.destroy();
    return usuario;
  }

  /**
   * Buscar todos os usuários ativos
   */
  async buscarAtivos(opcoes = {}) {
    return await Usuario.findAll({
      where: { ativo: true },
      attributes: { exclude: ['senha'] },
      order: [['nome', 'ASC']],
      ...opcoes
    });
  }

  /**
   * Buscar usuários por tipo
   */
  async buscarPorTipo(tipo, opcoes = {}) {
    return await Usuario.findAll({
      where: { tipo, ativo: true },
      attributes: { exclude: ['senha'] },
      order: [['nome', 'ASC']],
      ...opcoes
    });
  }

  /**
   * Verificar se email existe
   */
  async emailExiste(email, excluirId = null) {
    const where = { email };
    if (excluirId) {
      where.id = { [Op.ne]: excluirId };
    }
    
    const count = await Usuario.count({ where });
    return count > 0;
  }

  /**
   * Atualizar último acesso
   */
  async atualizarUltimoAcesso(id) {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return null;
    }
    
    await usuario.update({ ultimo_acesso: new Date() });
    return usuario;
  }

  /**
   * Contar total de usuários
   */
  async contarTotal(filtros = {}) {
    const { whereCustom } = filtros;
    return await Usuario.count({ where: whereCustom || {} });
  }
}

export default new UsuarioRepository();

