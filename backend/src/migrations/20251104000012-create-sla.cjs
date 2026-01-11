'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sla', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      grupo_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'grupo',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID do grupo (NULL = SLA global)'
      },
      tipo_chamado: {
        type: Sequelize.ENUM('incidente', 'requisicao', 'problema', 'mudanca'),
        allowNull: true,
        comment: 'Tipo de chamado (NULL = todos os tipos)'
      },
      prioridade: {
        type: Sequelize.ENUM('baixa', 'media', 'alta', 'urgente'),
        allowNull: false,
        comment: 'Prioridade do chamado'
      },
      tempo_limite_horas: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Tempo limite em horas para resolução'
      },
      tempo_primeira_resposta_horas: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Tempo limite em horas para primeira resposta (opcional)'
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Indica se o SLA está ativo'
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

    // Criar índices
    await queryInterface.addIndex('sla', ['grupo_id'], {
      name: 'sla_grupo_idx'
    });

    await queryInterface.addIndex('sla', ['tipo_chamado', 'prioridade'], {
      name: 'sla_tipo_prioridade_idx'
    });

    await queryInterface.addIndex('sla', ['ativo'], {
      name: 'sla_ativo_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sla');
  }
};

