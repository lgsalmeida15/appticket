'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('comentario', 'tarefa_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'chamado_tarefa',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
      // Nullable: chamado_id continua sempre preenchido. Comentário de chamado
      // "raiz" tem tarefa_id = null; comentário de uma tarefa específica tem
      // tarefa_id preenchido. A listagem padrão de comentários do chamado
      // exclui os que têm tarefa_id preenchido (ver comentarioRepository).
    });

    await queryInterface.addIndex('comentario', ['tarefa_id'], {
      name: 'comentario_tarefa_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('comentario', 'comentario_tarefa_idx');
    await queryInterface.removeColumn('comentario', 'tarefa_id');
  }
};
