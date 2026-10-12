'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ticket_time_tracking', 'tarefa_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'chamado_tarefa',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
      // Nullable de propósito: chamado_id continua sempre preenchido (denormalizado),
      // tarefa_id só é preenchido quando a sessão pertence a uma tarefa específica.
      // Isso garante que o total do chamado (que filtra só por chamado_id) já soma
      // o tempo das tarefas automaticamente, sem nenhuma mudança nessas funções.
    });

    await queryInterface.addIndex('ticket_time_tracking', ['tarefa_id'], {
      name: 'ticket_time_tracking_tarefa_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('ticket_time_tracking', 'ticket_time_tracking_tarefa_idx');
    await queryInterface.removeColumn('ticket_time_tracking', 'tarefa_id');
  }
};
