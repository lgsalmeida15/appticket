/**
 * DTO para criação de comentário
 */
class CriarComentarioDTO {
  constructor(dados) {
    this.texto = dados.texto;
    this.interno = dados.interno || false;
    this.anexos = dados.anexos || [];
  }

  toJSON() {
    return {
      texto: this.texto,
      interno: this.interno,
      anexos: this.anexos
    };
  }
}

export default CriarComentarioDTO;

