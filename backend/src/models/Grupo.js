import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Grupo = sequelize.define('grupo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Nome do grupo é obrigatório'
      },
      len: {
        args: [2, 100],
        msg: 'Nome deve ter entre 2 e 100 caracteres'
      }
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  solicitante: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica se o grupo pode solicitar chamados'
  },
  executor: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica se o grupo pode executar chamados'
  },
  webhook_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'URL do webhook inválida'
      }
    }
  },
  webhook_eventos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de eventos que disparam webhook: [criar_chamado, atualizar_status, novo_comentario]'
  }
}, {
  tableName: 'grupo',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Grupo;

