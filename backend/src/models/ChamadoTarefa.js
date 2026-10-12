import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ChamadoTarefa = sequelize.define('chamado_tarefa', {
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
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Título da tarefa é obrigatório'
      }
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pendente', 'em_andamento', 'concluida', 'cancelada'),
    allowNull: false,
    defaultValue: 'pendente'
  },
  data_inicio_prevista: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Data de início planejada, para calendário/Gantt'
  },
  data_fim_prevista: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Data de término planejada, para calendário/Gantt'
  },
  responsavel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuario',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  criado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  concluida_em: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'chamado_tarefa',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['chamado_id'], name: 'chamado_tarefa_chamado_idx_model' },
    { fields: ['responsavel_id'], name: 'chamado_tarefa_responsavel_idx_model' },
    { fields: ['status'], name: 'chamado_tarefa_status_idx_model' }
  ]
});

export default ChamadoTarefa;
