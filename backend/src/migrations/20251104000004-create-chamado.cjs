'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chamado', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      titulo: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      tipo: {
        type: Sequelize.ENUM('incidente', 'requisicao', 'problema', 'mudanca'),
        allowNull: false,
        defaultValue: 'incidente'
      },
      prioridade: {
        type: Sequelize.ENUM('baixa', 'media', 'alta', 'urgente'),
        allowNull: false,
        defaultValue: 'media'
      },
      status: {
        type: Sequelize.ENUM('aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado', 'cancelado'),
        allowNull: false,
        defaultValue: 'aberto'
      },
      grupo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'grupo',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      atribuido_a: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuario',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      data_abertura: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      data_fechamento: {
        type: Sequelize.DATE,
        allowNull: true
      },
      prazo: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      },
      campos_customizados: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '{}'
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

    // Índices para otimização
    await queryInterface.addIndex('chamado', ['grupo_id'], {
      name: 'chamado_grupo_idx'
    });

    await queryInterface.addIndex('chamado', ['usuario_id'], {
      name: 'chamado_usuario_idx'
    });

    await queryInterface.addIndex('chamado', ['atribuido_a'], {
      name: 'chamado_atribuido_idx'
    });

    await queryInterface.addIndex('chamado', ['status'], {
      name: 'chamado_status_idx'
    });

    await queryInterface.addIndex('chamado', ['prioridade'], {
      name: 'chamado_prioridade_idx'
    });

    await queryInterface.addIndex('chamado', ['tipo'], {
      name: 'chamado_tipo_idx'
    });

    await queryInterface.addIndex('chamado', ['data_abertura'], {
      name: 'chamado_data_abertura_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chamado');
  }
};

