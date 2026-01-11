'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('solution_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      categoria_nivel_1: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      categoria_nivel_2: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      categoria_nivel_3: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Adicionar índices para melhor performance (com verificação de existência)
    try {
      await queryInterface.addIndex('solution_categories', ['ativo'], {
        name: 'solution_categories_ativo'
      });
    } catch (error) {
      // Índice já existe, ignorar
      console.log('Índice solution_categories_ativo já existe, ignorando...');
    }
    
    try {
      await queryInterface.addIndex('solution_categories', ['categoria_nivel_1', 'categoria_nivel_2', 'categoria_nivel_3'], {
        unique: true,
        name: 'solution_categories_unique'
      });
    } catch (error) {
      // Índice já existe, ignorar
      console.log('Índice solution_categories_unique já existe, ignorando...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('solution_categories');
  }
};

