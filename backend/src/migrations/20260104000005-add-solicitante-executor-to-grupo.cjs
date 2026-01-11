'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('grupo', 'solicitante', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Indica se o grupo pode solicitar chamados'
    });

    await queryInterface.addColumn('grupo', 'executor', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Indica se o grupo pode executar chamados'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('grupo', 'executor');
    await queryInterface.removeColumn('grupo', 'solicitante');
  }
};

