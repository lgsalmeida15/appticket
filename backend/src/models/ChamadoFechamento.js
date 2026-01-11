import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ChamadoFechamento = sequelize.define('chamado_fechamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  chamado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'chamado',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  data_hora_resolucao: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Data/hora de resolução inválida'
      }
    }
  },
  categoria_solucao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'solution_categories',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  descricao_fechamento: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Descrição do fechamento é obrigatória'
      },
      len: {
        args: [10],
        msg: 'Descrição do fechamento deve ter no mínimo 10 caracteres'
      }
    }
  },
  usuario_fechamento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  }
}, {
  tableName: 'chamado_fechamentos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default ChamadoFechamento;

