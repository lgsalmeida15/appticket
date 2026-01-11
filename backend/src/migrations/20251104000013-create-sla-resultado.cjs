'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sla_resultado', {
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
      sla_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sla',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      estourou: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indica se o SLA foi estourado'
      },
      tempo_total_horas: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Tempo total em horas até resolução'
      },
      tempo_primeira_resposta_horas: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Tempo até primeira resposta em horas'
      },
      prazo_limite: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Data/hora do prazo limite do SLA'
      },
      data_resolucao: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Data/hora da resolução do chamado'
      },
      data_verificacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Data/hora da última verificação do SLA'
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
    await queryInterface.addIndex('sla_resultado', ['chamado_id'], {
      name: 'sla_resultado_chamado_idx'
    });

    await queryInterface.addIndex('sla_resultado', ['sla_id'], {
      name: 'sla_resultado_sla_idx'
    });

    await queryInterface.addIndex('sla_resultado', ['estourou'], {
      name: 'sla_resultado_estourou_idx'
    });

    await queryInterface.addIndex('sla_resultado', ['data_verificacao'], {
      name: 'sla_resultado_data_verificacao_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sla_resultado');
  }
};

