'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chamado_tarefa', {
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
      titulo: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pendente', 'em_andamento', 'concluida', 'cancelada'),
        allowNull: false,
        defaultValue: 'pendente'
      },
      data_inicio_prevista: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Data de início planejada, para calendário/Gantt'
      },
      data_fim_prevista: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Data de término planejada, para calendário/Gantt'
      },
      responsavel_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuario',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      criado_por: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      concluida_em: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex('chamado_tarefa', ['chamado_id'], {
      name: 'chamado_tarefa_chamado_idx'
    });
    await queryInterface.addIndex('chamado_tarefa', ['responsavel_id'], {
      name: 'chamado_tarefa_responsavel_idx'
    });
    await queryInterface.addIndex('chamado_tarefa', ['status'], {
      name: 'chamado_tarefa_status_idx'
    });
    await queryInterface.addIndex('chamado_tarefa', ['data_inicio_prevista'], {
      name: 'chamado_tarefa_data_inicio_idx'
    });
    await queryInterface.addIndex('chamado_tarefa', ['data_fim_prevista'], {
      name: 'chamado_tarefa_data_fim_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chamado_tarefa');
  }
};
