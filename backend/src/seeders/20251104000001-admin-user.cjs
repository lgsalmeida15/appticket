'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash('admin123', salt);

    await queryInterface.bulkInsert('usuario', [{
      nome: 'Administrador',
      email: 'admin@appticket.com',
      senha: senhaHash,
      tipo: 'admin',
      ativo: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('usuario', {
      email: 'admin@appticket.com'
    }, {});
  }
};

