'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('chamado', 'grupo_executor_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'grupo',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Grupo responsável pela execução do chamado'
    });

    // Adicionar índice para melhorar performance
    await queryInterface.addIndex('chamado', ['grupo_executor_id'], {
      name: 'chamado_grupo_executor_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('chamado', 'chamado_grupo_executor_id_idx');
    await queryInterface.removeColumn('chamado', 'grupo_executor_id');
  }
};

