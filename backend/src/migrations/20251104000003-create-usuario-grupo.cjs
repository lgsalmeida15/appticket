'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuario_grupo', {
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
        onDelete: 'CASCADE'
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
      papel: {
        type: Sequelize.ENUM('gerente', 'agente'),
        allowNull: false,
        defaultValue: 'agente'
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

    // Criar índice único para usuário + grupo (se não existir)
    try {
      await queryInterface.addIndex('usuario_grupo', ['usuario_id', 'grupo_id'], {
        name: 'usuario_grupo_unique_idx',
        unique: true
      });
    } catch (error) {
      const errorMsg = (error.message || error.original?.message || '').toLowerCase();
      if (errorMsg.includes('already exists') || 
          errorMsg.includes('duplicate key value') ||
          errorMsg.includes('relation') && errorMsg.includes('already exists')) {
        console.log('Índice usuario_grupo_unique_idx já existe, pulando...');
      } else {
        throw error;
      }
    }

    // Criar índice para grupo (se não existir)
    try {
      await queryInterface.addIndex('usuario_grupo', ['grupo_id'], {
        name: 'usuario_grupo_grupo_idx'
      });
    } catch (error) {
      const errorMsg = (error.message || error.original?.message || '').toLowerCase();
      if (errorMsg.includes('already exists') || 
          errorMsg.includes('duplicate key value') ||
          errorMsg.includes('relation') && errorMsg.includes('already exists')) {
        console.log('Índice usuario_grupo_grupo_idx já existe, pulando...');
      } else {
        throw error;
      }
    }

    // Criar índice para papel (se não existir)
    try {
      await queryInterface.addIndex('usuario_grupo', ['papel'], {
        name: 'usuario_grupo_papel_idx'
      });
    } catch (error) {
      const errorMsg = (error.message || error.original?.message || '').toLowerCase();
      if (errorMsg.includes('already exists') || 
          errorMsg.includes('duplicate key value') ||
          (errorMsg.includes('relation') && errorMsg.includes('already exists'))) {
        console.log('Índice usuario_grupo_papel_idx já existe, pulando...');
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuario_grupo');
  }
};

