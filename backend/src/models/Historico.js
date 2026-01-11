import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Historico = sequelize.define('historico', {
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
  acao: {
    type: DataTypes.ENUM(
      'criacao',
      'atribuicao',
      'mudanca_status',
      'mudanca_prioridade',
      'mudanca_tipo',
      'adicao_comentario',
      'edicao',
      'fechamento',
      'reabertura',
      'cancelamento',
      'associacao_filho',
      'desassociacao_filho'
    ),
    allowNull: false,
    validate: {
      isIn: {
        args: [[
          'criacao',
          'atribuicao',
          'mudanca_status',
          'mudanca_prioridade',
          'mudanca_tipo',
          'adicao_comentario',
          'edicao',
          'fechamento',
          'reabertura',
          'cancelamento',
          'associacao_filho',
          'desassociacao_filho'
        ]],
        msg: 'Ação inválida'
      }
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Descrição detalhada da ação realizada'
  },
  dados_anteriores: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Estado anterior dos dados (para auditoria)'
  },
  dados_novos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Novo estado dos dados'
  },
  data_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'historico',
  timestamps: false
});

export default Historico;

