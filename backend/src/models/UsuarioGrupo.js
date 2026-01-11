import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UsuarioGrupo = sequelize.define('usuario_grupo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  grupo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'grupo',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  papel: {
    type: DataTypes.ENUM('gerente', 'agente'),
    allowNull: false,
    defaultValue: 'agente',
    validate: {
      isIn: {
        args: [['gerente', 'agente']],
        msg: 'Papel deve ser: gerente ou agente'
      }
    }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'usuario_grupo',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['usuario_id', 'grupo_id'],
      name: 'usuario_grupo_unique_idx'
    }
  ]
});

export default UsuarioGrupo;

