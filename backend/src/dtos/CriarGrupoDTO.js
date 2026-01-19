/**
 * DTO para criação de grupo
 */
class CriarGrupoDTO {
  constructor(dados) {
    this.nome = dados.nome;
    this.descricao = dados.descricao || null;
    this.ativo = dados.ativo !== undefined ? dados.ativo : true;
    // Transformar string vazia em null
    this.webhook_url = dados.webhook_url && dados.webhook_url.trim() !== '' ? dados.webhook_url : null;
    this.webhook_eventos = dados.webhook_eventos || [];
  }

  toJSON() {
    return {
      nome: this.nome,
      descricao: this.descricao,
      ativo: this.ativo,
      webhook_url: this.webhook_url,
      webhook_eventos: this.webhook_eventos
    };
  }
}

export default CriarGrupoDTO;

