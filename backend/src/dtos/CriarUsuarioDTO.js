/**
 * DTO para criação de usuário
 */
class CriarUsuarioDTO {
  constructor(dados) {
    this.nome = dados.nome;
    this.email = dados.email;
    this.password = dados.password || dados.senha;
    this.tipo = dados.tipo || 'agente';
    this.ativo = dados.ativo !== undefined ? dados.ativo : true;
  }

  toJSON() {
    return {
      nome: this.nome,
      email: this.email,
      password: this.password,
      tipo: this.tipo,
      ativo: this.ativo
    };
  }
}

export default CriarUsuarioDTO;

