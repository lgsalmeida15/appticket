import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Chamado = sequelize.define('chamado', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Título é obrigatório'
      },
      len: {
        args: [3, 200],
        msg: 'Título deve ter entre 3 e 200 caracteres'
      }
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Descrição é obrigatória'
      }
    }
  },
  tipo: {
    type: DataTypes.ENUM('incidente', 'requisicao', 'problema', 'mudanca'),
    allowNull: false,
    defaultValue: 'incidente',
    validate: {
      isIn: {
        args: [['incidente', 'requisicao', 'problema', 'mudanca']],
        msg: 'Tipo inválido'
      }
    }
  },
  prioridade: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'urgente'),
    allowNull: false,
    defaultValue: 'media',
    validate: {
      isIn: {
        args: [['baixa', 'media', 'alta', 'urgente']],
        msg: 'Prioridade inválida'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('novo', 'aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado', 'cancelado'),
    allowNull: false,
    defaultValue: 'novo',
    validate: {
      isIn: {
        args: [['novo', 'aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado', 'cancelado']],
        msg: 'Status inválido'
      }
    }
  },
  status_fechamento: {
    type: DataTypes.ENUM('aberto', 'fechado'),
    allowNull: false,
    defaultValue: 'aberto',
    validate: {
      isIn: {
        args: [['aberto', 'fechado']],
        msg: 'Status de fechamento inválido'
      }
    }
  },
  grupo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'grupo',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  grupo_executor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'grupo',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Grupo responsável pela execução do chamado'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    comment: 'Usuário que criou o chamado'
  },
  atribuido_a: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuario',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Usuário responsável pelo chamado'
  },
  data_abertura: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  data_fechamento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prazo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de tags: ["hardware", "software", "rede"]'
  },
  campos_customizados: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Campos personalizados do formulário'
  },
  chamado_pai_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'chamado',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'ID do chamado pai (relação parent/child)'
  }
}, {
  tableName: 'chamado',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Chamado;

