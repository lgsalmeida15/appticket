'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Primeiro, remover a constraint de foreign key
    await queryInterface.removeConstraint('historico_auditoria', 'historico_auditoria_usuario_id_fkey');
    
    // Alterar a coluna para permitir NULL
    await queryInterface.changeColumn('historico_auditoria', 'usuario_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Permitir NULL para ações sem usuário autenticado
    });
    
    // Recriar a constraint de foreign key com as mesmas configurações
    await queryInterface.addConstraint('historico_auditoria', {
      fields: ['usuario_id'],
      type: 'foreign key',
      name: 'historico_auditoria_usuario_id_fkey',
      references: {
        table: 'usuario',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remover a constraint de foreign key
    await queryInterface.removeConstraint('historico_auditoria', 'historico_auditoria_usuario_id_fkey');
    
    // Reverter a coluna para NOT NULL
    await queryInterface.changeColumn('historico_auditoria', 'usuario_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    
    // Recriar a constraint de foreign key
    await queryInterface.addConstraint('historico_auditoria', {
      fields: ['usuario_id'],
      type: 'foreign key',
      name: 'historico_auditoria_usuario_id_fkey',
      references: {
        table: 'usuario',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  }
};
