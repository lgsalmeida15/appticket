import Comentario from '../models/Comentario.js';
import Usuario from '../models/Usuario.js';
import Chamado from '../models/Chamado.js';
import { Op } from 'sequelize';

/**
 * Repository para operações de banco de dados relacionadas a comentários
 * Isola acesso direto ao Sequelize
 */
class ComentarioRepository {
  /**
   * Criar novo comentário
   */
  async criar(dados) {
    return await Comentario.create(dados);
  }

  /**
   * Buscar comentário por ID
   */
  async buscarPorId(id, opcoes = {}) {
    const include = [];
    
    if (opcoes.incluirUsuario !== false) {
      include.push({
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      });
    }
    
    if (opcoes.incluirChamado) {
      include.push({
        model: Chamado,
        as: 'chamado',
        attributes: ['id', 'titulo', 'status']
      });
    }

    return await Comentario.findByPk(id, { include });
  }

  /**
   * Listar comentários de um chamado
   */
  async listarPorChamado(chamadoId, opcoes = {}) {
    const {
      incluirInternos = true,
      apenasInternos = false
    } = opcoes;

    const where = { chamado_id: chamadoId };
    
    if (!incluirInternos) {
      where.interno = false;
    }
    
    if (apenasInternos) {
      where.interno = true;
    }

    return await Comentario.findAll({
      where,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }],
      order: [['data_hora', 'ASC']]
    });
  }

  /**
   * Buscar comentários por usuário
   */
  async buscarPorUsuario(usuarioId, opcoes = {}) {
    return await Comentario.findAll({
      where: { usuario_id: usuarioId },
      include: [{
        model: Chamado,
        as: 'chamado',
        attributes: ['id', 'titulo', 'status']
      }],
      order: [['data_hora', 'DESC']],
      ...opcoes
    });
  }

  /**
   * Atualizar comentário
   */
  async atualizar(id, dados) {
    const comentario = await Comentario.findByPk(id);
    if (!comentario) {
      return null;
    }
    
    await comentario.update({
      ...dados,
      editado: true
    });
    
    return comentario;
  }

  /**
   * Deletar comentário
   */
  async deletar(id) {
    const comentario = await Comentario.findByPk(id);
    if (!comentario) {
      return null;
    }
    
    await comentario.destroy();
    return comentario;
  }

  /**
   * Contar comentários de um chamado
   */
  async contarPorChamado(chamadoId, opcoes = {}) {
    const { incluirInternos = true } = opcoes;
    
    const where = { chamado_id: chamadoId };
    if (!incluirInternos) {
      where.interno = false;
    }
    
    return await Comentario.count({ where });
  }

  /**
   * Buscar último comentário de um chamado
   */
  async buscarUltimoPorChamado(chamadoId, opcoes = {}) {
    const { incluirInternos = true } = opcoes;
    
    const where = { chamado_id: chamadoId };
    if (!incluirInternos) {
      where.interno = false;
    }

    return await Comentario.findOne({
      where,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }],
      order: [['data_hora', 'DESC']]
    });
  }
}

export default new ComentarioRepository();

