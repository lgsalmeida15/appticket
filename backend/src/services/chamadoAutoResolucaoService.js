import chamadoRepository from '../repositories/chamadoRepository.js';
import historicoRepository from '../repositories/historicoRepository.js';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';
import Chamado from '../models/Chamado.js';
import Usuario from '../models/Usuario.js';

/**
 * Service para atualização automática de status de chamados
 * Atualiza chamados com status "fechado" para "resolvido" após 7 dias
 */
class ChamadoAutoResolucaoService {
  /**
   * Atualizar chamados fechados para resolvido após 7 dias
   * @returns {Promise<Object>} Resultado da atualização
   */
  async atualizarChamadosFechadosParaResolvido() {
    try {
      // Calcular data limite (7 dias atrás)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 7);
      // Zerar horas para comparar apenas a data
      dataLimite.setHours(0, 0, 0, 0);

      // Buscar chamados com status "fechado" e data_fechamento <= 7 dias atrás
      const chamados = await Chamado.findAll({
        where: {
          status: 'fechado',
          status_fechamento: 'fechado',
          data_fechamento: {
            [Op.lte]: dataLimite
          }
        }
      });

      let atualizados = 0;
      let erros = 0;

      // Atualizar cada chamado
      for (const chamado of chamados) {
        try {
          // Verificar quantos dias o chamado está fechado
          const dataFechamento = new Date(chamado.data_fechamento);
          const diasFechado = Math.floor((new Date() - dataFechamento) / (1000 * 60 * 60 * 24));

          // Só atualizar se tiver 7 dias ou mais
          if (diasFechado >= 7) {
            // Atualizar status para resolvido
            await chamadoRepository.atualizar(chamado.id, {
              status: 'resolvido'
            });

            // Registrar no histórico usando o repository diretamente
            // Buscar primeiro administrador ativo para registrar no histórico
            try {
              const admin = await Usuario.findOne({
                where: {
                  tipo: 'admin',
                  ativo: true
                },
                order: [['id', 'ASC']]
              });

              if (admin) {
                await historicoRepository.criar({
                  chamado_id: chamado.id,
                  usuario_id: admin.id,
                  acao: 'mudanca_status',
                  descricao: `Status alterado automaticamente de "fechado" para "resolvido" após ${diasFechado} dias`,
                  dados_anteriores: { status: 'fechado' },
                  dados_novos: { status: 'resolvido', motivo: 'auto_resolucao_7_dias' },
                  data_hora: new Date()
                });
              } else {
                logger.warn('Nenhum administrador encontrado para registrar histórico de auto-resolução', {
                  chamadoId: chamado.id
                });
              }
            } catch (histError) {
              // Se falhar ao registrar histórico, apenas loga mas continua
              logger.warn('Erro ao registrar histórico de auto-resolução', {
                chamadoId: chamado.id,
                error: histError.message
              });
            }

            atualizados++;

            logger.info('Chamado atualizado automaticamente para resolvido', {
              chamadoId: chamado.id,
              dataFechamento: chamado.data_fechamento,
              diasFechado
            });
          }
        } catch (error) {
          erros++;
          logger.error('Erro ao atualizar chamado automaticamente', {
            chamadoId: chamado.id,
            error: error.message
          });
        }
      }

      const resultado = {
        totalEncontrados: chamados.length,
        atualizados,
        erros,
        dataExecucao: new Date(),
        dataLimite
      };

      if (atualizados > 0) {
        logger.info('Job de auto-resolução executado com sucesso', resultado);
      } else if (chamados.length > 0) {
        logger.debug('Job de auto-resolução executado, nenhum chamado atualizado', resultado);
      }

      return resultado;
    } catch (error) {
      logger.error('Erro ao executar job de auto-resolução de chamados', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

export default new ChamadoAutoResolucaoService();
