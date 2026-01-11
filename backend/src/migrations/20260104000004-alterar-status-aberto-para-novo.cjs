'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar 'novo' ao ENUM de status
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_chamado_status" ADD VALUE IF NOT EXISTS 'novo';
    `);

    // Atualizar chamados existentes com status 'aberto' para 'novo'
    await queryInterface.sequelize.query(`
      UPDATE chamado SET status = 'novo' WHERE status = 'aberto';
    `);

    // Nota: PostgreSQL não permite remover valores de ENUM facilmente
    // O valor 'aberto' continuará existindo no ENUM mas não será mais usado
  },

  async down(queryInterface, Sequelize) {
    // Reverter: mudar 'novo' de volta para 'aberto'
    await queryInterface.sequelize.query(`
      UPDATE chamado SET status = 'aberto' WHERE status = 'novo';
    `);
  }
};

