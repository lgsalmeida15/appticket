import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TicketTimeTracking = sequelize.define('ticket_time_tracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  chamado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chamado',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Data e hora de início da contagem'
  },
  fim: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data e hora de fim da contagem (NULL = contagem ativa)'
  },
  duracao_minutos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duração em minutos (calculado quando fim é preenchido)'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição opcional do trabalho realizado'
  }
}, {
  tableName: 'ticket_time_tracking',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['chamado_id'],
      name: 'ticket_time_tracking_chamado_idx'
    },
    {
      fields: ['usuario_id'],
      name: 'ticket_time_tracking_usuario_idx'
    },
    {
      fields: ['chamado_id', 'usuario_id'],
      name: 'ticket_time_tracking_chamado_usuario_idx'
    }
  ]
});

export default TicketTimeTracking;

