import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WebhookLog = sequelize.define('WebhookLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  grupo_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Webhook global, grupo_id é opcional
    references: {
      model: 'grupo',
      key: 'id'
    }
  },
  chamado_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'chamado',
      key: 'id'
    }
  },
  evento: {
    type: DataTypes.ENUM(
      'chamado_criado',
      'chamado_atualizado',
      'comentario_adicionado'
    ),
    allowNull: false,
    comment: 'Tipo de evento que disparou o webhook global'
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  metodo: {
    type: DataTypes.STRING(10),
    defaultValue: 'POST'
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  status_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  resposta: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  erro: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tentativas: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  sucesso: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tempo_resposta_ms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  data_hora: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'webhook_log',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default WebhookLog;

