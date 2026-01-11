'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar coluna chamado_pai_id (relação auto-referencial)
    await queryInterface.addColumn('chamado', 'chamado_pai_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'chamado',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'ID do chamado pai (relação parent/child)'
    });

    // Adicionar índice para melhorar performance nas consultas de filhos
    await queryInterface.addIndex('chamado', ['chamado_pai_id'], {
      name: 'chamado_chamado_pai_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remover índice
    await queryInterface.removeIndex('chamado', 'chamado_chamado_pai_id_idx');
    
    // Remover coluna
    await queryInterface.removeColumn('chamado', 'chamado_pai_id');
  }
};

