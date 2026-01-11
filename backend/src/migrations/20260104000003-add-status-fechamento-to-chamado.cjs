'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar campo status_fechamento
    await queryInterface.addColumn('chamado', 'status_fechamento', {
      type: Sequelize.ENUM('aberto', 'fechado'),
      allowNull: false,
      defaultValue: 'aberto',
      after: 'status'
    });

    // Adicionar índice para melhor performance nas consultas
    try {
      await queryInterface.addIndex('chamado', ['status_fechamento'], {
        name: 'chamado_status_fechamento'
      });
    } catch (error) {
      console.log('Índice chamado_status_fechamento já existe, ignorando...');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remover índice
    try {
      await queryInterface.removeIndex('chamado', 'chamado_status_fechamento');
    } catch (error) {
      console.log('Índice não existe, continuando...');
    }
    
    // Remover coluna
    await queryInterface.removeColumn('chamado', 'status_fechamento');
    
    // Remover o tipo ENUM (opcional, dependendo do banco)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chamado_status_fechamento";');
  }
};

