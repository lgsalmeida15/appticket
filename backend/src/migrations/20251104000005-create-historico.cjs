'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('historico', {
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
      acao: {
        type: Sequelize.ENUM(
          'criacao',
          'atribuicao',
          'mudanca_status',
          'mudanca_prioridade',
          'mudanca_tipo',
          'adicao_comentario',
          'edicao',
          'fechamento',
          'reabertura',
          'cancelamento'
        ),
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      dados_anteriores: {
        type: Sequelize.JSON,
        allowNull: true
      },
      dados_novos: {
        type: Sequelize.JSON,
        allowNull: true
      },
      data_hora: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices
    await queryInterface.addIndex('historico', ['chamado_id'], {
      name: 'historico_chamado_idx'
    });

    await queryInterface.addIndex('historico', ['usuario_id'], {
      name: 'historico_usuario_idx'
    });

    await queryInterface.addIndex('historico', ['acao'], {
      name: 'historico_acao_idx'
    });

    await queryInterface.addIndex('historico', ['data_hora'], {
      name: 'historico_data_hora_idx'
    });

    // Índice composto para buscar histórico de um chamado ordenado por data
    await queryInterface.addIndex('historico', ['chamado_id', 'data_hora'], {
      name: 'historico_chamado_data_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('historico');
  }
};

