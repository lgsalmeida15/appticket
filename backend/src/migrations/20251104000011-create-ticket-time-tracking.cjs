'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ticket_time_tracking', {
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
      inicio: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Data e hora de início da contagem'
      },
      fim: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Data e hora de fim da contagem (NULL = contagem ativa)'
      },
      duracao_minutos: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duração em minutos (calculado quando fim é preenchido)'
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Descrição opcional do trabalho realizado'
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

    // Criar índices para melhorar performance
    await queryInterface.addIndex('ticket_time_tracking', ['chamado_id'], {
      name: 'ticket_time_tracking_chamado_idx'
    });

    await queryInterface.addIndex('ticket_time_tracking', ['usuario_id'], {
      name: 'ticket_time_tracking_usuario_idx'
    });

    await queryInterface.addIndex('ticket_time_tracking', ['chamado_id', 'usuario_id'], {
      name: 'ticket_time_tracking_chamado_usuario_idx'
    });

    await queryInterface.addIndex('ticket_time_tracking', ['fim'], {
      name: 'ticket_time_tracking_fim_idx',
      where: { fim: null } // Índice parcial para contagens ativas
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ticket_time_tracking');
  }
};

