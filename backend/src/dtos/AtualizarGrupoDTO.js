/**
 * DTO para atualização de grupo
 */
class AtualizarGrupoDTO {
  constructor(dados) {
    this.nome = dados.nome;
    this.descricao = dados.descricao;
    this.ativo = dados.ativo;
    // Transformar string vazia em null
    this.webhook_url = dados.webhook_url !== undefined 
      ? (dados.webhook_url && dados.webhook_url.trim() !== '' ? dados.webhook_url : null)
      : undefined;
    this.webhook_eventos = dados.webhook_eventos;
  }

  toJSON() {
    const dto = {};
    if (this.nome !== undefined) dto.nome = this.nome;
    if (this.descricao !== undefined) dto.descricao = this.descricao;
    if (this.ativo !== undefined) dto.ativo = this.ativo;
    if (this.webhook_url !== undefined) dto.webhook_url = this.webhook_url;
    if (this.webhook_eventos !== undefined) dto.webhook_eventos = this.webhook_eventos;
    return dto;
  }
}

export default AtualizarGrupoDTO;

