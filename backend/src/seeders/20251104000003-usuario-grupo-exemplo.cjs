'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Buscar IDs de usuários e grupos
    const [usuarios] = await queryInterface.sequelize.query(
      `SELECT id, email FROM usuario WHERE email IN ('admin@appticket.com')`
    );

    const [grupos] = await queryInterface.sequelize.query(
      `SELECT id, nome FROM grupo WHERE nome IN ('Suporte Técnico', 'Desenvolvimento', 'Atendimento')`
    );

    if (usuarios.length === 0 || grupos.length === 0) {
      console.log('Usuários ou grupos não encontrados. Execute os seeds anteriores primeiro.');
      return;
    }

    const admin = usuarios.find(u => u.email === 'admin@appticket.com');
    const suporte = grupos.find(g => g.nome === 'Suporte Técnico');
    const desenvolvimento = grupos.find(g => g.nome === 'Desenvolvimento');
    const atendimento = grupos.find(g => g.nome === 'Atendimento');

    // Adicionar admin como gerente em todos os grupos
    const registros = [];

    if (admin && suporte) {
      registros.push({
        usuario_id: admin.id,
        grupo_id: suporte.id,
        papel: 'gerente',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    if (admin && desenvolvimento) {
      registros.push({
        usuario_id: admin.id,
        grupo_id: desenvolvimento.id,
        papel: 'gerente',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    if (admin && atendimento) {
      registros.push({
        usuario_id: admin.id,
        grupo_id: atendimento.id,
        papel: 'gerente',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    if (registros.length > 0) {
      await queryInterface.bulkInsert('usuario_grupo', registros, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('usuario_grupo', null, {});
  }
};

