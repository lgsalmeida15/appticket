'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('grupo', [
      {
        nome: 'Suporte Técnico',
        descricao: 'Equipe responsável pelo suporte técnico e infraestrutura',
        ativo: true,
        solicitante: true,
        executor: true,
        webhook_url: null,
        webhook_eventos: JSON.stringify(['criar_chamado', 'atualizar_status']),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Desenvolvimento',
        descricao: 'Equipe de desenvolvimento de software',
        ativo: true,
        solicitante: false,
        executor: true,
        webhook_url: null,
        webhook_eventos: JSON.stringify(['criar_chamado', 'novo_comentario']),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Atendimento',
        descricao: 'Equipe de atendimento ao cliente',
        ativo: true,
        solicitante: true,
        executor: false,
        webhook_url: null,
        webhook_eventos: JSON.stringify([]),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('grupo', null, {});
  }
};

