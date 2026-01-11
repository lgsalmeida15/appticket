/**
 * Handlers de eventos para webhooks e auditoria
 * Registra listeners para eventos do sistema
 */
import eventEmitter from './EventEmitter.js';
import WebhookService from '../services/webhookService.js';
import auditoriaService from '../services/auditoriaService.js';

/**
 * Registrar todos os handlers de eventos
 */
export function registrarEventHandlers() {
  // Eventos de chamado
  eventEmitter.on('chamado:criado', async (dados) => {
    const { chamado, req } = dados;
    
    try {
      // Disparar webhook global
      await WebhookService.chamadoCriado(chamado);
    } catch (err) {
      console.error('❌ Erro ao disparar webhook de criação:', err);
    }
  });

  eventEmitter.on('chamado:atualizado', async (dados) => {
    const { chamado, dadosAnteriores, req } = dados;
    
    try {
      // Disparar webhook global para qualquer atualização
      await WebhookService.chamadoAtualizado(chamado, dadosAnteriores);
    } catch (err) {
      console.error('❌ Erro ao disparar webhook de atualização:', err);
    }
  });

  eventEmitter.on('comentario:adicionado', async (dados) => {
    const { chamado, comentario } = dados;
    
    try {
      // Disparar webhook global para comentário
      await WebhookService.comentarioAdicionado(chamado, comentario);
    } catch (err) {
      console.error('❌ Erro ao disparar webhook de comentário:', err);
    }
  });

  // Eventos de usuário
  eventEmitter.on('usuario:criado', async (dados) => {
    const { usuario, req } = dados;
    // Auditoria já é registrada no service, mas pode adicionar webhooks futuros aqui
  });

  eventEmitter.on('usuario:atualizado', async (dados) => {
    const { usuario, dadosAnteriores, req } = dados;
    // Auditoria já é registrada no service
  });

  eventEmitter.on('usuario:deletado', async (dados) => {
    const { usuario, req } = dados;
    // Auditoria já é registrada no service
  });

  // Eventos de grupo
  eventEmitter.on('grupo:criado', async (dados) => {
    const { grupo, req } = dados;
    // Auditoria já é registrada no service
  });

  eventEmitter.on('grupo:atualizado', async (dados) => {
    const { grupo, dadosAnteriores, req } = dados;
    // Auditoria já é registrada no service
  });

  eventEmitter.on('grupo:deletado', async (dados) => {
    const { grupo, req } = dados;
    // Auditoria já é registrada no service
  });

  // Eventos de autenticação
  eventEmitter.on('auth:login', async (dados) => {
    const { usuario, req } = dados;
    // Auditoria já é registrada no service
  });

  eventEmitter.on('auth:logout', async (dados) => {
    const { usuario, req } = dados;
    // Auditoria já é registrada no service
  });

  eventEmitter.on('auth:login_falhado', async (dados) => {
    const { email, motivo, req } = dados;
    // Auditoria já é registrada no service
  });
}

export default registrarEventHandlers;

