import auditoriaRepository from '../repositories/historicoAuditoriaRepository.js';
import Usuario from '../models/Usuario.js';

/**
 * Listar logs de auditoria
 */
export const listarLogs = async (req, res, next) => {
  try {
    const pageNum = parseInt(req.query.page);
    const limitNum = parseInt(req.query.limit);
    const page = (!isNaN(pageNum) && pageNum > 0) ? pageNum : 1;
    const limit = (!isNaN(limitNum) && limitNum > 0) ? limitNum : 20;

    const usuarioIdNum = req.query.usuario_id ? parseInt(req.query.usuario_id) : undefined;
    const usuario_id = (usuarioIdNum !== undefined && !isNaN(usuarioIdNum) && usuarioIdNum > 0) ? usuarioIdNum : undefined;

    const filtros = {
      page,
      limit,
      usuario_id,
      entidade: req.query.entidade || undefined,
      acao: req.query.acao || undefined,
      dataInicio: req.query.data_inicio || undefined,
      dataFim: req.query.data_fim ? req.query.data_fim + ' 23:59:59' : undefined
    };

    // Remover filtros undefined
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === undefined || key === 'page' || key === 'limit') {
        return;
      }
    });

    const resultado = await auditoriaRepository.listar(filtros);

    res.json({
      logs: resultado.registros.map(r => r.toJSON ? r.toJSON() : r),
      total: resultado.total,
      page: resultado.page,
      limit: resultado.limit,
      totalPages: resultado.totalPages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar log por ID
 */
export const buscarLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const log = await auditoriaRepository.buscarPorId(idNum, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }]
    });

    if (!log) {
      const error = new Error('Log de auditoria não encontrado');
      error.statusCode = 404;
      error.code = 'AUDIT_LOG_NOT_FOUND';
      throw error;
    }

    res.json({ log });
  } catch (error) {
    next(error);
  }
};

export default {
  listarLogs,
  buscarLog
};

