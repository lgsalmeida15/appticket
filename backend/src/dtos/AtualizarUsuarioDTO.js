/**
 * DTO para atualização de usuário
 */
class AtualizarUsuarioDTO {
  constructor(dados) {
    this.nome = dados.nome;
    this.email = dados.email;
    this.password = dados.password || dados.senha || null;
    this.tipo = dados.tipo;
    this.ativo = dados.ativo;
  }

  toJSON() {
    const dto = {};
    if (this.nome !== undefined) dto.nome = this.nome;
    if (this.email !== undefined) dto.email = this.email;
    if (this.password) dto.password = this.password;
    if (this.tipo !== undefined) dto.tipo = this.tipo;
    if (this.ativo !== undefined) dto.ativo = this.ativo;
    return dto;
  }
}

export default AtualizarUsuarioDTO;

