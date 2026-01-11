/**
 * Sistema de eventos simples para desacoplar serviços
 * Baseado no padrão Observer
 */
class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Registrar listener para um evento
   * @param {String} evento - Nome do evento
   * @param {Function} callback - Função a ser chamada quando evento ocorrer
   */
  on(evento, callback) {
    if (!this.listeners.has(evento)) {
      this.listeners.set(evento, []);
    }
    this.listeners.get(evento).push(callback);
  }

  /**
   * Remover listener
   * @param {String} evento - Nome do evento
   * @param {Function} callback - Função a ser removida
   */
  off(evento, callback) {
    if (!this.listeners.has(evento)) {
      return;
    }
    const callbacks = this.listeners.get(evento);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emitir evento (notificar todos os listeners)
   * @param {String} evento - Nome do evento
   * @param {*} dados - Dados a serem passados aos listeners
   */
  async emit(evento, dados = {}) {
    if (!this.listeners.has(evento)) {
      return;
    }

    const callbacks = this.listeners.get(evento);
    
    // Executar todos os callbacks (pode ser async)
    const promises = callbacks.map(callback => {
      try {
        return Promise.resolve(callback(dados));
      } catch (error) {
        console.error(`Erro ao executar listener para evento "${evento}":`, error);
        return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Limpar todos os listeners de um evento
   * @param {String} evento - Nome do evento (opcional, se não fornecido limpa todos)
   */
  removeAllListeners(evento = null) {
    if (evento) {
      this.listeners.delete(evento);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Verificar se há listeners para um evento
   * @param {String} evento - Nome do evento
   * @returns {Boolean}
   */
  hasListeners(evento) {
    return this.listeners.has(evento) && this.listeners.get(evento).length > 0;
  }
}

// Singleton para uso global
export default new EventEmitter();

