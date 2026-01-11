'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chamado_fechamentos', {
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
      data_hora_resolucao: {
        type: Sequelize.DATE,
        allowNull: false
      },
      categoria_solucao_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'solution_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      descricao_fechamento: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      usuario_fechamento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Adicionar índices (com verificação de existência)
    try {
      await queryInterface.addIndex('chamado_fechamentos', ['chamado_id'], {
        unique: true,
        name: 'chamado_fechamentos_chamado_id_unique'
      });
    } catch (error) {
      console.log('Índice chamado_fechamentos_chamado_id_unique já existe, ignorando...');
    }
    
    try {
      await queryInterface.addIndex('chamado_fechamentos', ['categoria_solucao_id'], {
        name: 'chamado_fechamentos_categoria_solucao_id'
      });
    } catch (error) {
      console.log('Índice chamado_fechamentos_categoria_solucao_id já existe, ignorando...');
    }
    
    try {
      await queryInterface.addIndex('chamado_fechamentos', ['usuario_fechamento_id'], {
        name: 'chamado_fechamentos_usuario_fechamento_id'
      });
    } catch (error) {
      console.log('Índice chamado_fechamentos_usuario_fechamento_id já existe, ignorando...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chamado_fechamentos');
  }
};

