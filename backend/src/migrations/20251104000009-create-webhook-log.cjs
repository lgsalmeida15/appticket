'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('webhook_log', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      grupo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'grupo',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      chamado_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'chamado',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      evento: {
        type: Sequelize.ENUM(
          'chamado_criado',
          'chamado_atualizado',
          'status_alterado',
          'comentario_adicionado',
          'chamado_atribuido',
          'prioridade_alterada'
        ),
        allowNull: false
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      metodo: {
        type: Sequelize.STRING(10),
        defaultValue: 'POST'
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      status_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      resposta: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      erro: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tentativas: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      sucesso: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      tempo_resposta_ms: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      data_hora: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Índices para performance
    await queryInterface.addIndex('webhook_log', ['grupo_id']);
    await queryInterface.addIndex('webhook_log', ['chamado_id']);
    await queryInterface.addIndex('webhook_log', ['evento']);
    await queryInterface.addIndex('webhook_log', ['sucesso']);
    await queryInterface.addIndex('webhook_log', ['data_hora']);
    await queryInterface.addIndex('webhook_log', ['grupo_id', 'evento']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('webhook_log');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_webhook_log_evento";');
  }
};

