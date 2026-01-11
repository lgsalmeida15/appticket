'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('historico_auditoria', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      entidade: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Nome da entidade: chamado, usuario, grupo, etc'
      },
      entidade_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID da entidade afetada'
      },
      acao: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Ação realizada: criacao, atualizacao, exclusao, login, logout, erro_critico'
      },
      dados_anteriores: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Estado anterior dos dados (para auditoria)'
      },
      dados_novos: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Novo estado dos dados'
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'Endereço IP de origem'
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User agent do navegador'
      },
      data: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar índices para melhorar performance
    await queryInterface.addIndex('historico_auditoria', ['usuario_id'], {
      name: 'historico_auditoria_usuario_idx'
    });

    await queryInterface.addIndex('historico_auditoria', ['entidade', 'entidade_id'], {
      name: 'historico_auditoria_entidade_idx'
    });

    await queryInterface.addIndex('historico_auditoria', ['acao'], {
      name: 'historico_auditoria_acao_idx'
    });

    await queryInterface.addIndex('historico_auditoria', ['data'], {
      name: 'historico_auditoria_data_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('historico_auditoria');
  }
};

