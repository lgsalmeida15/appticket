import chamadoTarefaService from '../services/chamadoTarefaService.js';
import comentarioService from '../services/comentarioService.js';
import timeTrackingService from '../services/timeTrackingService.js';

const parseIds = (req) => {
  const chamadoId = parseInt(req.params.id);
  const tarefaId = parseInt(req.params.tarefaId);
  if (isNaN(chamadoId) || chamadoId <= 0 || (req.params.tarefaId !== undefined && (isNaN(tarefaId) || tarefaId <= 0))) {
    const error = new Error('IDs inválidos');
    error.statusCode = 400;
    error.code = 'INVALID_IDS';
    throw error;
  }
  return { chamadoId, tarefaId };
};

export const listarTarefas = async (req, res, next) => {
  try {
    const { chamadoId } = parseIds(req);
    const tarefas = await chamadoTarefaService.listarPorChamado(chamadoId);
    res.json({ tarefas });
  } catch (error) {
    next(error);
  }
};

export const criarTarefa = async (req, res, next) => {
  try {
    const { chamadoId } = parseIds(req);
    const tarefa = await chamadoTarefaService.criar(chamadoId, req.usuario.id, req.validatedData || req.body);
    res.status(201).json({ message: 'Tarefa criada com sucesso', tarefa });
  } catch (error) {
    next(error);
  }
};

export const buscarTarefa = async (req, res, next) => {
  try {
    const { chamadoId, tarefaId } = parseIds(req);
    const tarefa = await chamadoTarefaService.buscarPorId(chamadoId, tarefaId);
    res.json({ tarefa });
  } catch (error) {
    next(error);
  }
};

export const atualizarTarefa = async (req, res, next) => {
  try {
    const { chamadoId, tarefaId } = parseIds(req);
    const tarefa = await chamadoTarefaService.atualizar(chamadoId, tarefaId, req.validatedData || req.body);
    res.json({ message: 'Tarefa atualizada com sucesso', tarefa });
  } catch (error) {
    next(error);
  }
};

export const cancelarTarefa = async (req, res, next) => {
  try {
    const { chamadoId, tarefaId } = parseIds(req);
    const tarefa = await chamadoTarefaService.cancelar(chamadoId, tarefaId);
    res.json({ message: 'Tarefa cancelada com sucesso', tarefa });
  } catch (error) {
    next(error);
  }
};

export const iniciarContagemTarefa = async (req, res, next) => {
  try {
    const { chamadoId, tarefaId } = parseIds(req);
    const { descricao } = req.body || {};
    const registro = await timeTrackingService.iniciarContagem(chamadoId, req.usuario.id, descricao, tarefaId);
    res.status(201).json({ message: 'Contagem de tempo iniciada', registro });
  } catch (error) {
    next(error);
  }
};

export const pararContagemTarefa = async (req, res, next) => {
  try {
    const { chamadoId, tarefaId } = parseIds(req);
    const registro = await timeTrackingService.pararContagem(chamadoId, req.usuario.id, tarefaId);
    res.json({ message: 'Contagem de tempo parada', registro });
  } catch (error) {
    next(error);
  }
};

export const buscarHistoricoTempoTarefa = async (req, res, next) => {
  try {
    const { chamadoId, tarefaId } = parseIds(req);
    const resultado = await timeTrackingService.buscarHistoricoPorTarefa(chamadoId, tarefaId);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export const listarComentariosTarefa = async (req, res, next) => {
  try {
    const { tarefaId } = parseIds(req);
    const comentarios = await comentarioService.listarPorTarefa(tarefaId);
    res.json({ comentarios });
  } catch (error) {
    next(error);
  }
};

export const adicionarComentarioTarefa = async (req, res, next) => {
  try {
    const { chamadoId, tarefaId } = parseIds(req);
    const { texto, interno = false, anexos = [] } = req.body;
    const comentario = await comentarioService.adicionarComentarioTarefa(chamadoId, tarefaId, req.usuario.id, {
      texto,
      interno,
      anexos
    });
    res.status(201).json({ message: 'Comentário adicionado com sucesso', comentario });
  } catch (error) {
    next(error);
  }
};

export default {
  listarTarefas,
  criarTarefa,
  buscarTarefa,
  atualizarTarefa,
  cancelarTarefa,
  iniciarContagemTarefa,
  pararContagemTarefa,
  buscarHistoricoTempoTarefa,
  listarComentariosTarefa,
  adicionarComentarioTarefa
};
