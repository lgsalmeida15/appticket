/**
 * DTO para criação de chamado
 * Define estrutura de dados para criação de chamados
 */
export class CriarChamadoDTO {
  constructor(dados) {
    this.titulo = dados.titulo;
    this.descricao = dados.descricao;
    this.tipo = dados.tipo || 'incidente';
    this.prioridade = dados.prioridade || 'media';
    this.grupo_id = dados.grupo_id;
    this.atribuido_a = dados.atribuido_a || null;
    this.prazo = dados.prazo || null;
    this.tags = dados.tags || [];
    this.campos_customizados = dados.campos_customizados || {};
    this.anexos = dados.anexos || [];
  }

  /**
   * Converter para objeto simples
   */
  toJSON() {
    return {
      titulo: this.titulo,
      descricao: this.descricao,
      tipo: this.tipo,
      prioridade: this.prioridade,
      grupo_id: this.grupo_id,
      atribuido_a: this.atribuido_a,
      prazo: this.prazo,
      tags: this.tags,
      campos_customizados: this.campos_customizados,
      anexos: this.anexos
    };
  }

  /**
   * Validar DTO
   */
  validar() {
    const erros = [];

    if (!this.titulo || this.titulo.trim().length < 3) {
      erros.push('Título deve ter no mínimo 3 caracteres');
    }

    if (!this.descricao || this.descricao.trim().length < 1) {
      erros.push('Descrição é obrigatória');
    }

    if (!this.grupo_id) {
      erros.push('Grupo é obrigatório');
    }

    if (erros.length > 0) {
      const error = new Error('Dados inválidos');
      error.statusCode = 400;
      error.details = erros;
      throw error;
    }

    return true;
  }
}

export default CriarChamadoDTO;

