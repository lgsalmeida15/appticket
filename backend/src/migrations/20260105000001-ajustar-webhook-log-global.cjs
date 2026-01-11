'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tornar grupo_id nullable (webhook agora é global, não por grupo)
    await queryInterface.changeColumn('webhook_log', 'grupo_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Agora pode ser null
      references: {
        model: 'grupo',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 2. Simplificar enum de eventos (manter apenas chamado_criado e chamado_atualizado)
    // Primeiro, remover a constraint do enum
    await queryInterface.sequelize.query(`
      ALTER TABLE webhook_log 
      ALTER COLUMN evento TYPE VARCHAR(50);
    `);

    // Recriar o enum simplificado
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_webhook_log_evento";
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_webhook_log_evento" AS ENUM (
        'chamado_criado',
        'chamado_atualizado',
        'comentario_adicionado'
      );
    `);

    // Aplicar o novo enum
    await queryInterface.sequelize.query(`
      ALTER TABLE webhook_log 
      ALTER COLUMN evento TYPE "enum_webhook_log_evento" 
      USING evento::"enum_webhook_log_evento";
    `);
  },

  async down(queryInterface, Sequelize) {
    // Reverter grupo_id para not null
    await queryInterface.changeColumn('webhook_log', 'grupo_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'grupo',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Reverter enum para valores originais
    await queryInterface.sequelize.query(`
      ALTER TABLE webhook_log 
      ALTER COLUMN evento TYPE VARCHAR(50);
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_webhook_log_evento";
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_webhook_log_evento" AS ENUM (
        'chamado_criado',
        'chamado_atualizado',
        'status_alterado',
        'comentario_adicionado',
        'chamado_atribuido',
        'prioridade_alterada'
      );
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE webhook_log 
      ALTER COLUMN evento TYPE "enum_webhook_log_evento" 
      USING evento::"enum_webhook_log_evento";
    `);
  }
};

