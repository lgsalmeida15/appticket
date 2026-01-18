'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar novo campo data_hora_inicio (inicialmente nullable para permitir migração)
    await queryInterface.addColumn('chamado', 'data_hora_inicio', {
      type: Sequelize.DATE,
      allowNull: true // Inicialmente nullable para permitir migração de dados
    });

    // Adicionar campos de auditoria
    await queryInterface.addColumn('chamado', 'data_hora_inicio_alterado_por', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'usuario',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('chamado', 'data_hora_inicio_alterado_em', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Migração de dados existentes: copiar created_at para data_hora_inicio
    await queryInterface.sequelize.query(`
      UPDATE chamado 
      SET data_hora_inicio = created_at
      WHERE data_hora_inicio IS NULL;
    `);

    // Tornar campo NOT NULL após popular dados
    await queryInterface.changeColumn('chamado', 'data_hora_inicio', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    // Adicionar índice para melhor performance em queries
    await queryInterface.addIndex('chamado', ['data_hora_inicio'], {
      name: 'idx_chamados_data_hora_inicio'
    });

    // Adicionar constraints para validação
    // Nota: PostgreSQL não suporta CHECK constraints diretamente com CURRENT_TIMESTAMP dinâmico
    // A validação será feita no backend
    // Mas podemos adicionar uma constraint simples para garantir que não seja posterior a created_at
    // Isso será feito via validação no backend devido à limitação do CHECK constraint
  },

  async down(queryInterface, Sequelize) {
    // Remover índice
    await queryInterface.removeIndex('chamado', 'idx_chamados_data_hora_inicio');

    // Remover colunas
    await queryInterface.removeColumn('chamado', 'data_hora_inicio_alterado_em');
    await queryInterface.removeColumn('chamado', 'data_hora_inicio_alterado_por');
    await queryInterface.removeColumn('chamado', 'data_hora_inicio');
  }
};

