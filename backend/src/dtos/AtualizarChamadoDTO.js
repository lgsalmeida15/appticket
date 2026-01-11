/**
 * DTO para atualização de chamado
 * Define estrutura de dados para atualização de chamados
 */
export class AtualizarChamadoDTO {
  constructor(dados) {
    this.titulo = dados.titulo;
    this.descricao = dados.descricao;
    this.tipo = dados.tipo;
    this.prioridade = dados.prioridade;
    this.status = dados.status;
    this.atribuido_a = dados.atribuido_a;
    this.prazo = dados.prazo;
    this.tags = dados.tags;
    this.campos_customizados = dados.campos_customizados;
  }

  /**
   * Converter para objeto simples (apenas campos definidos)
   */
  toJSON() {
    const json = {};

    if (this.titulo !== undefined) json.titulo = this.titulo;
    if (this.descricao !== undefined) json.descricao = this.descricao;
    if (this.tipo !== undefined) json.tipo = this.tipo;
    if (this.prioridade !== undefined) json.prioridade = this.prioridade;
    if (this.status !== undefined) json.status = this.status;
    if (this.atribuido_a !== undefined) json.atribuido_a = this.atribuido_a;
    if (this.prazo !== undefined) json.prazo = this.prazo;
    if (this.tags !== undefined) json.tags = this.tags;
    if (this.campos_customizados !== undefined) json.campos_customizados = this.campos_customizados;

    return json;
  }

  /**
   * Verificar se há campos administrativos
   */
  temCamposAdministrativos() {
    return this.status !== undefined || 
           this.prioridade !== undefined || 
           this.tipo !== undefined || 
           this.atribuido_a !== undefined;
  }
}

export default AtualizarChamadoDTO;

