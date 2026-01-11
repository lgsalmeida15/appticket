import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SolutionCategory = sequelize.define('solution_category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  categoria_nivel_1: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Categoria nível 1 é obrigatória'
      },
      len: {
        args: [2, 100],
        msg: 'Categoria nível 1 deve ter entre 2 e 100 caracteres'
      }
    }
  },
  categoria_nivel_2: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Categoria nível 2 é obrigatória'
      },
      len: {
        args: [2, 100],
        msg: 'Categoria nível 2 deve ter entre 2 e 100 caracteres'
      }
    }
  },
  categoria_nivel_3: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Categoria nível 3 é obrigatória'
      },
      len: {
        args: [2, 100],
        msg: 'Categoria nível 3 deve ter entre 2 e 100 caracteres'
      }
    }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'solution_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default SolutionCategory;

