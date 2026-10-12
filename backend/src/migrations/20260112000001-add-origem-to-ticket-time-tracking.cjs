'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ticket_time_tracking', 'origem', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'manual'
      // Valores possíveis (validados na aplicação, não via CHECK): 'manual', 'retroativo'.
      // 'retroativo' marca registros reconstruídos a partir do histórico de mudança de
      // status de chamados antigos, para distinguir de sessões realmente cronometradas.
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ticket_time_tracking', 'origem');
  }
};
