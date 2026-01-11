import axios from 'axios';
import crypto from 'crypto';
import WebhookLog from '../models/WebhookLog.js';
import logger from '../utils/logger.js';

/**
 * Serviço de Webhooks Global
 * Dispara webhook único para todas as criações/atualizações de chamados
 */
class WebhookService {
  /**
   * Configurações de retry
   */
  MAX_TENTATIVAS = 3;
  TIMEOUT_MS = 10000; // 10 segundos

  /**
   * Verifica se o webhook global está configurado
   */
  webhookConfigurado() {
    const url = this.getWebhookUrl();
    return !!url;
  }

  /**
   * Obtém a URL do webhook do arquivo .env
   */
  getWebhookUrl() {
    return process.env.WEBHOOK_URL;
  }

  /**
   * Gera assinatura HMAC para segurança
   */
  gerarAssinatura(payload, secret) {
    if (!secret) return null;
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Dispara webhook global para criação/atualização de chamado
   */
  async dispararWebhookGlobal(evento, dadosCompletos, tentativa = 1) {
    try {
      // Verificar se webhook está configurado
      if (!this.webhookConfigurado()) {
        logger.debug('Webhook global não configurado, pulando disparo');
        return null;
      }

      const webhookUrl = this.getWebhookUrl();
      const webhookSecret = process.env.WEBHOOK_SECRET || null;
      
      logger.info(`🔔 Disparando webhook: ${evento} para ${webhookUrl}`);

      // Preparar payload completo
      const payload = {
        evento,
        timestamp: new Date().toISOString(),
        ...dadosCompletos
      };

      // Gerar assinatura (se tiver secret configurado)
      const assinatura = webhookSecret ? this.gerarAssinatura(payload, webhookSecret) : null;

      // Headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'AppTicket-Webhook/1.0',
        'X-Webhook-Event': evento,
        'X-Webhook-Timestamp': payload.timestamp
      };

      if (assinatura) {
        headers['X-Webhook-Signature'] = assinatura;
      }

      // Iniciar timer
      const inicio = Date.now();

      // Fazer requisição POST
      const response = await axios({
        method: 'POST',
        url: webhookUrl,
        data: payload,
        headers,
        timeout: this.TIMEOUT_MS,
        validateStatus: () => true // Aceitar qualquer status
      });

      const tempoResposta = Date.now() - inicio;
      const sucesso = response.status >= 200 && response.status < 300;

      // Criar log
      const log = await WebhookLog.create({
        grupo_id: dadosCompletos.chamado?.grupo_id || null,
        chamado_id: dadosCompletos.chamado?.id || null,
        evento,
        url: webhookUrl,
        metodo: 'POST',
        payload,
        status_code: response.status,
        resposta: JSON.stringify(response.data).substring(0, 5000), // Limitar tamanho
        erro: null,
        tentativas: tentativa,
        sucesso,
        tempo_resposta_ms: tempoResposta,
        data_hora: new Date()
      });

      // Se falhou e ainda tem tentativas, retry
      if (!sucesso && tentativa < this.MAX_TENTATIVAS) {
        logger.warn(`Webhook falhou (tentativa ${tentativa}/${this.MAX_TENTATIVAS}), tentando novamente...`);
        
        // Aguardar antes de retry (backoff exponencial)
        await this.aguardar(Math.pow(2, tentativa) * 1000);
        
        return await this.dispararWebhookGlobal(evento, dadosCompletos, tentativa + 1);
      }

      if (sucesso) {
        logger.info(`✅ Webhook disparado com sucesso: ${evento} para chamado #${dadosCompletos.chamado?.id}`);
      } else {
        logger.error(`❌ Webhook falhou após ${tentativa} tentativas: ${evento} para chamado #${dadosCompletos.chamado?.id}`);
      }

      return log;

    } catch (error) {
      logger.error('Erro ao disparar webhook:', error);

      // Criar log de erro
      const log = await WebhookLog.create({
        grupo_id: dadosCompletos.chamado?.grupo_id || null,
        chamado_id: dadosCompletos.chamado?.id || null,
        evento,
        url: error.config?.url || this.getWebhookUrl() || 'unknown',
        metodo: 'POST',
        payload: {
          evento,
          timestamp: new Date().toISOString(),
          ...dadosCompletos
        },
        status_code: error.response?.status || null,
        resposta: error.response?.data ? JSON.stringify(error.response.data).substring(0, 5000) : null,
        erro: error.message || 'Erro desconhecido',
        tentativas: tentativa,
        sucesso: false,
        tempo_resposta_ms: null,
        data_hora: new Date()
      });

      // Retry se ainda há tentativas
      if (tentativa < this.MAX_TENTATIVAS) {
        logger.warn(`Erro no webhook (tentativa ${tentativa}/${this.MAX_TENTATIVAS}), tentando novamente...`);
        await this.aguardar(Math.pow(2, tentativa) * 1000);
        return await this.dispararWebhookGlobal(evento, dadosCompletos, tentativa + 1);
      }

      return log;
    }
  }

  /**
   * Helper para aguardar (usado no retry)
   */
  aguardar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Prepara dados completos do chamado para webhook
   */
  prepararDadosChamado(chamado) {
    // Converter para JSON se for instância Sequelize
    const chamadoData = chamado.toJSON ? chamado.toJSON() : chamado;
    
    const dados = {
      chamado: {
        id: chamadoData.id,
        titulo: chamadoData.titulo,
        descricao: chamadoData.descricao,
        tipo: chamadoData.tipo,
        status: chamadoData.status,
        prioridade: chamadoData.prioridade,
        data_abertura: chamadoData.data_abertura,
        data_fechamento: chamadoData.data_fechamento,
        status_fechamento: chamadoData.status_fechamento,
        grupo_id: chamadoData.grupo_id,
        grupo_nome: chamadoData.grupo?.nome || null
      },
      usuario_criador: null,
      responsavel: null
    };

    // Dados do usuário que criou o chamado (relacionamento é 'criador', não 'usuario')
    const criador = chamadoData.criador || chamado.criador;
    if (criador) {
      const criadorData = criador.toJSON ? criador.toJSON() : criador;
      dados.usuario_criador = {
        id: criadorData.id,
        nome: criadorData.nome,
        email: criadorData.email,
        login: criadorData.email // Usando email como login
      };
    }

    // Dados do responsável (se atribuído)
    const responsavel = chamadoData.responsavel || chamado.responsavel;
    if (responsavel) {
      const responsavelData = responsavel.toJSON ? responsavel.toJSON() : responsavel;
      dados.responsavel = {
        id: responsavelData.id,
        nome: responsavelData.nome,
        email: responsavelData.email,
        login: responsavelData.email // Usando email como login
      };
    }

    return dados;
  }

  /**
   * Disparar webhook para criação de chamado
   */
  async chamadoCriado(chamado) {
    if (!this.webhookConfigurado()) {
      logger.debug('Webhook não configurado para chamado criado');
      return null;
    }
    
    logger.info(`📨 Preparando webhook para chamado criado #${chamado.id}`);
    const dadosCompletos = this.prepararDadosChamado(chamado);
    
    return await this.dispararWebhookGlobal('chamado_criado', dadosCompletos);
  }

  /**
   * Disparar webhook para atualização de chamado
   */
  async chamadoAtualizado(chamado, dadosAnteriores = {}) {
    if (!this.webhookConfigurado()) {
      logger.debug('Webhook não configurado para atualização de chamado');
      return null;
    }
    
    logger.info(`📨 Preparando webhook para chamado atualizado #${chamado.id}`);
    
    const dadosCompletos = this.prepararDadosChamado(chamado);

    // Adicionar campos alterados e valores anteriores
    const camposAlterados = [];
    const valoresAnteriores = {};

    // Verificar quais campos foram alterados
    const camposParaVerificar = ['status', 'prioridade', 'titulo', 'descricao', 'tipo'];
    camposParaVerificar.forEach(campo => {
      if (dadosAnteriores[campo] !== undefined && dadosAnteriores[campo] !== chamado[campo]) {
        camposAlterados.push(campo);
        valoresAnteriores[campo] = dadosAnteriores[campo];
      }
    });

    // Verificar atribuição
    if (dadosAnteriores.atribuido_a !== chamado.atribuido_a) {
      camposAlterados.push('atribuido_a');
      valoresAnteriores.atribuido_a = dadosAnteriores.atribuido_a;
    }

    dadosCompletos.campos_alterados = camposAlterados;
    dadosCompletos.valores_anteriores = valoresAnteriores;

    return await this.dispararWebhookGlobal('chamado_atualizado', dadosCompletos);
  }

  /**
   * Disparar webhook para novo comentário
   */
  async comentarioAdicionado(chamado, comentario) {
    if (!this.webhookConfigurado()) {
      logger.debug('Webhook não configurado para comentário');
      return null;
    }
    
    logger.info(`📨 Preparando webhook para comentário #${comentario.id} no chamado #${chamado.id}`);
    
    const dadosCompletos = this.prepararDadosChamado(chamado);

    // Converter comentário para JSON se for instância Sequelize
    const comentarioData = comentario.toJSON ? comentario.toJSON() : comentario;

    // Adicionar informações do comentário
    dadosCompletos.comentario = {
      id: comentarioData.id,
      texto: comentarioData.texto,
      interno: comentarioData.interno,
      data_hora: comentarioData.data_hora
    };

    // Adicionar dados do usuário que comentou
    const usuarioComentario = comentarioData.usuario || comentario.usuario;
    if (usuarioComentario) {
      const usuarioData = usuarioComentario.toJSON ? usuarioComentario.toJSON() : usuarioComentario;
      dadosCompletos.usuario_comentario = {
        id: usuarioData.id,
        nome: usuarioData.nome,
        email: usuarioData.email,
        login: usuarioData.email
      };
    }

    return await this.dispararWebhookGlobal('comentario_adicionado', dadosCompletos);
  }
}

export default new WebhookService();

