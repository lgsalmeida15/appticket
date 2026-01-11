'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    await queryInterface.bulkInsert('solution_categories', [
      {
        categoria_nivel_1: 'Outros',
        categoria_nivel_2: 'Erro de abertura',
        categoria_nivel_3: 'Causa não detectada',
        ativo: true,
        created_at: now,
        updated_at: now
      },
      {
        categoria_nivel_1: 'Problema Resolvido',
        categoria_nivel_2: 'Configuração',
        categoria_nivel_3: 'Ajuste de parâmetros',
        ativo: true,
        created_at: now,
        updated_at: now
      },
      {
        categoria_nivel_1: 'Problema Resolvido',
        categoria_nivel_2: 'Hardware',
        categoria_nivel_3: 'Substituição de componente',
        ativo: true,
        created_at: now,
        updated_at: now
      },
      {
        categoria_nivel_1: 'Problema Resolvido',
        categoria_nivel_2: 'Software',
        categoria_nivel_3: 'Atualização de sistema',
        ativo: true,
        created_at: now,
        updated_at: now
      },
      {
        categoria_nivel_1: 'Sem Solução',
        categoria_nivel_2: 'Problema Externo',
        categoria_nivel_3: 'Aguardando terceiros',
        ativo: true,
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('solution_categories', null, {});
  }
};

