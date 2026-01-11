import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HistoricoAuditoria = sequelize.define('historico_auditoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Permitir NULL para ações sem usuário autenticado (ex: login falhado)
    references: {
      model: 'usuario',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  entidade: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Nome da entidade: chamado, usuario, grupo, etc'
  },
  entidade_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID da entidade afetada'
  },
  acao: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Ação realizada: criacao, atualizacao, exclusao, login, logout, erro_critico'
  },
  dados_anteriores: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Estado anterior dos dados (para auditoria)'
  },
  dados_novos: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Novo estado dos dados'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Endereço IP de origem'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent do navegador'
  },
  data: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'historico_auditoria',
  timestamps: false,
  indexes: [
    {
      fields: ['usuario_id'],
      name: 'historico_auditoria_usuario_idx'
    },
    {
      fields: ['entidade', 'entidade_id'],
      name: 'historico_auditoria_entidade_idx'
    },
    {
      fields: ['acao'],
      name: 'historico_auditoria_acao_idx'
    },
    {
      fields: ['data'],
      name: 'historico_auditoria_data_idx'
    }
  ]
});

export default HistoricoAuditoria;

