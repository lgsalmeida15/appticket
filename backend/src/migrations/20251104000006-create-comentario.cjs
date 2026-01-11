'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('comentario', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      chamado_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chamado',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      texto: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      interno: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      anexos: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      },
      editado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      data_hora: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices
    await queryInterface.addIndex('comentario', ['chamado_id'], {
      name: 'comentario_chamado_idx'
    });

    await queryInterface.addIndex('comentario', ['usuario_id'], {
      name: 'comentario_usuario_idx'
    });

    await queryInterface.addIndex('comentario', ['data_hora'], {
      name: 'comentario_data_hora_idx'
    });

    // Índice composto
    await queryInterface.addIndex('comentario', ['chamado_id', 'data_hora'], {
      name: 'comentario_chamado_data_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('comentario');
  }
};

