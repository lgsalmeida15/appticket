'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar novas ações ao ENUM de histórico (associação_filho e desassociacao_filho)
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_historico_acao" ADD VALUE IF NOT EXISTS 'associacao_filho';
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_historico_acao" ADD VALUE IF NOT EXISTS 'desassociacao_filho';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Nota: PostgreSQL não permite remover valores de ENUM facilmente
    // As ações 'associacao_filho' e 'desassociacao_filho' continuarão existindo
    // mas não serão mais usadas. Para remoção completa seria necessário
    // recriar o tipo ENUM, o que é complexo e pode quebrar dados existentes.
    console.log('Nota: Não é possível remover valores de ENUM no PostgreSQL sem recriar o tipo.');
  }
};

