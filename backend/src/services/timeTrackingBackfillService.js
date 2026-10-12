import Chamado from '../models/Chamado.js';
import HistoricoAuditoria from '../models/HistoricoAuditoria.js';
import TicketTimeTracking from '../models/TicketTimeTracking.js';
import logger from '../utils/logger.js';

const DURACAO_MINIMA_MS = 60 * 1000; // ignora gaps menores que 1 minuto

/**
 * Reconstitui retroativamente o tempo em que cada chamado ficou "em_andamento"
 * ANTES de existir o contador automático de tempo, usando o histórico de
 * auditoria (única fonte que registra toda mudança de status, incluindo
 * fechamento/reabertura, que não geram registro na tabela `historico`).
 *
 * Nunca sobrescreve ou duplica tempo já cronometrado: para cada período
 * "em_andamento" identificado, calcula apenas os trechos (gaps) ainda não
 * cobertos por nenhum registro existente em ticket_time_tracking (de
 * qualquer origem) e cria registros novos marcados com origem='retroativo'
 * só para esses trechos. Rodar de novo é seguro (idempotente): os trechos já
 * preenchidos por uma rodada anterior deixam de aparecer como gap.
 */
class TimeTrackingBackfillService {
  async _timelineStatus(chamadoId) {
    const registros = await HistoricoAuditoria.findAll({
      where: { entidade: 'chamado', entidade_id: chamadoId },
      order: [['data', 'ASC']],
      attributes: ['dados_novos', 'data']
    });

    const eventos = [];
    for (const r of registros) {
      const status = r.dados_novos?.status;
      if (!status) continue;
      eventos.push({ status, data: new Date(r.data) });
    }
    return eventos;
  }

  async _janelasEmAndamento(chamadoId) {
    const eventos = await this._timelineStatus(chamadoId);
    const janelas = [];
    let inicioAtual = null;

    for (const evento of eventos) {
      const emAndamento = evento.status === 'em_andamento';
      if (emAndamento && inicioAtual === null) {
        inicioAtual = evento.data;
      } else if (!emAndamento && inicioAtual !== null) {
        janelas.push({ inicio: inicioAtual, fim: evento.data });
        inicioAtual = null;
      }
    }

    // Se a última transição foi para "em_andamento" e nada fechou depois,
    // a janela continua aberta (chamado ainda em andamento hoje).
    if (inicioAtual !== null) {
      janelas.push({ inicio: inicioAtual, fim: null });
    }

    return janelas;
  }

  _gapsNaoCobertos(janela, coberturas) {
    const fimJanela = janela.fim ? janela.fim.getTime() : Date.now();
    let cursor = janela.inicio.getTime();
    const gaps = [];

    const ordenadas = [...coberturas].sort((a, b) => a.inicio - b.inicio);

    for (const cob of ordenadas) {
      const cobInicio = cob.inicio.getTime();
      const cobFim = cob.fim ? cob.fim.getTime() : Date.now();
      if (cobFim <= cursor || cobInicio >= fimJanela) continue; // não sobrepõe a janela
      if (cobInicio > cursor) {
        gaps.push({ inicio: new Date(cursor), fim: new Date(cobInicio) });
      }
      cursor = Math.max(cursor, cobFim);
    }

    if (cursor < fimJanela) {
      gaps.push({ inicio: new Date(cursor), fim: janela.fim }); // mantém null se a janela ainda está ativa
    }

    return gaps.filter((g) => {
      const fim = g.fim ? g.fim.getTime() : Date.now();
      return fim - g.inicio.getTime() >= DURACAO_MINIMA_MS;
    });
  }

  async _gapsPorChamado(chamadoId) {
    const janelas = await this._janelasEmAndamento(chamadoId);
    if (janelas.length === 0) return [];

    const existentes = await TicketTimeTracking.findAll({
      where: { chamado_id: chamadoId },
      attributes: ['inicio', 'fim']
    });
    const coberturas = existentes.map((e) => ({
      inicio: new Date(e.inicio),
      fim: e.fim ? new Date(e.fim) : null
    }));

    const gaps = [];
    for (const janela of janelas) {
      gaps.push(...this._gapsNaoCobertos(janela, coberturas));
    }
    return gaps;
  }

  /**
   * Pré-visualiza o backfill para todos os chamados, sem gravar nada.
   */
  async preverTodos() {
    const chamados = await Chamado.findAll({ attributes: ['id', 'titulo'] });
    const detalhe = [];

    for (const chamado of chamados) {
      const gaps = await this._gapsPorChamado(chamado.id);
      if (gaps.length === 0) continue;

      const totalMinutos = gaps.reduce((soma, g) => {
        const fim = g.fim ? g.fim.getTime() : Date.now();
        return soma + Math.floor((fim - g.inicio.getTime()) / 60000);
      }, 0);

      detalhe.push({
        chamado_id: chamado.id,
        titulo: chamado.titulo,
        gaps: gaps.length,
        total_minutos: totalMinutos
      });
    }

    return {
      chamados_afetados: detalhe.length,
      total_minutos: detalhe.reduce((s, r) => s + r.total_minutos, 0),
      detalhe
    };
  }

  /**
   * Executa o backfill de fato, criando registros "retroativo" para os gaps
   * encontrados. O responsável de cada registro é o atribuído atual do
   * chamado (ou o criador, se não houver atribuído) — o histórico de status
   * não guarda quem estava com o chamado em cada período, então essa é uma
   * aproximação deliberada, não um dado exato.
   */
  async executarTodos() {
    const chamados = await Chamado.findAll({ attributes: ['id', 'atribuido_a', 'usuario_id'] });
    let criados = 0;
    let chamadosAfetados = 0;

    for (const chamado of chamados) {
      const gaps = await this._gapsPorChamado(chamado.id);
      if (gaps.length === 0) continue;

      const responsavelId = chamado.atribuido_a || chamado.usuario_id;
      if (!responsavelId) continue; // segurança: nunca grava sem um usuario_id válido

      for (const gap of gaps) {
        const fimGap = gap.fim;
        const duracaoMinutos = fimGap
          ? Math.floor((fimGap.getTime() - gap.inicio.getTime()) / 60000)
          : null;

        await TicketTimeTracking.create({
          chamado_id: chamado.id,
          usuario_id: responsavelId,
          inicio: gap.inicio,
          fim: fimGap,
          duracao_minutos: duracaoMinutos,
          descricao: 'Tempo reconstituído retroativamente a partir do histórico de status (período anterior ao contador automático)',
          origem: 'retroativo'
        });
        criados++;
      }

      chamadosAfetados++;
    }

    logger.info('Backfill de time tracking executado', { chamadosAfetados, registrosCriados: criados });

    return { chamados_afetados: chamadosAfetados, registros_criados: criados };
  }
}

export default new TimeTrackingBackfillService();
