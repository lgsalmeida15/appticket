import sequelize from '../config/database.js';
import Usuario from './Usuario.js';
import Grupo from './Grupo.js';
import UsuarioGrupo from './UsuarioGrupo.js';
import Chamado from './Chamado.js';
import Historico from './Historico.js';
import Comentario from './Comentario.js';
import WebhookLog from './WebhookLog.js';
import HistoricoAuditoria from './HistoricoAuditoria.js';
import TicketTimeTracking from './TicketTimeTracking.js';
import SolutionCategory from './SolutionCategory.js';
import ChamadoFechamento from './ChamadoFechamento.js';

// ============================================
// RELACIONAMENTOS ENTRE MODELS
// ============================================

// Relacionamento: Usuario <-> Grupo (N:N através de UsuarioGrupo)
Usuario.belongsToMany(Grupo, {
  through: UsuarioGrupo,
  foreignKey: 'usuario_id',
  otherKey: 'grupo_id',
  as: 'grupos'
});

Grupo.belongsToMany(Usuario, {
  through: UsuarioGrupo,
  foreignKey: 'grupo_id',
  otherKey: 'usuario_id',
  as: 'usuarios'
});

// Relacionamento direto com UsuarioGrupo para acessar o papel
Usuario.hasMany(UsuarioGrupo, {
  foreignKey: 'usuario_id',
  as: 'usuario_grupos'
});

Grupo.hasMany(UsuarioGrupo, {
  foreignKey: 'grupo_id',
  as: 'grupo_usuarios'
});

UsuarioGrupo.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

UsuarioGrupo.belongsTo(Grupo, {
  foreignKey: 'grupo_id',
  as: 'grupo'
});

// Relacionamento: Chamado -> Grupo
Chamado.belongsTo(Grupo, {
  foreignKey: 'grupo_id',
  as: 'grupo'
});

Grupo.hasMany(Chamado, {
  foreignKey: 'grupo_id',
  as: 'chamados'
});

// Relacionamento: Chamado -> Grupo Executor
Chamado.belongsTo(Grupo, {
  foreignKey: 'grupo_executor_id',
  as: 'grupoExecutor'
});

Grupo.hasMany(Chamado, {
  foreignKey: 'grupo_executor_id',
  as: 'chamadosExecutor'
});

// Relacionamento: Chamado -> Usuario (criador)
Chamado.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'criador'
});

Usuario.hasMany(Chamado, {
  foreignKey: 'usuario_id',
  as: 'chamados_criados'
});

// Relacionamento: Chamado -> Usuario (atribuído)
Chamado.belongsTo(Usuario, {
  foreignKey: 'atribuido_a',
  as: 'responsavel'
});

Usuario.hasMany(Chamado, {
  foreignKey: 'atribuido_a',
  as: 'chamados_atribuidos'
});

// Relacionamento: Historico -> Chamado
Historico.belongsTo(Chamado, {
  foreignKey: 'chamado_id',
  as: 'chamado'
});

Chamado.hasMany(Historico, {
  foreignKey: 'chamado_id',
  as: 'historico'
});

// Relacionamento: Historico -> Usuario
Historico.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

Usuario.hasMany(Historico, {
  foreignKey: 'usuario_id',
  as: 'historicos'
});

// Relacionamento: Comentario -> Chamado
Comentario.belongsTo(Chamado, {
  foreignKey: 'chamado_id',
  as: 'chamado'
});

Chamado.hasMany(Comentario, {
  foreignKey: 'chamado_id',
  as: 'comentarios'
});

// Relacionamento: Comentario -> Usuario
Comentario.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

Usuario.hasMany(Comentario, {
  foreignKey: 'usuario_id',
  as: 'comentarios'
});

// Relacionamento: WebhookLog -> Grupo
WebhookLog.belongsTo(Grupo, {
  foreignKey: 'grupo_id',
  as: 'grupo'
});

Grupo.hasMany(WebhookLog, {
  foreignKey: 'grupo_id',
  as: 'webhook_logs'
});

// Relacionamento: WebhookLog -> Chamado (opcional)
WebhookLog.belongsTo(Chamado, {
  foreignKey: 'chamado_id',
  as: 'chamado'
});

Chamado.hasMany(WebhookLog, {
  foreignKey: 'chamado_id',
  as: 'webhook_logs'
});

// Relacionamento: HistoricoAuditoria -> Usuario
HistoricoAuditoria.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

Usuario.hasMany(HistoricoAuditoria, {
  foreignKey: 'usuario_id',
  as: 'historicos_auditoria'
});

// Relacionamento: TicketTimeTracking -> Chamado
TicketTimeTracking.belongsTo(Chamado, {
  foreignKey: 'chamado_id',
  as: 'chamado'
});

Chamado.hasMany(TicketTimeTracking, {
  foreignKey: 'chamado_id',
  as: 'time_tracking'
});

// Relacionamento: TicketTimeTracking -> Usuario
TicketTimeTracking.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

Usuario.hasMany(TicketTimeTracking, {
  foreignKey: 'usuario_id',
  as: 'time_tracking'
});

// Relacionamento: ChamadoFechamento -> Chamado
ChamadoFechamento.belongsTo(Chamado, {
  foreignKey: 'chamado_id',
  as: 'chamado'
});

Chamado.hasOne(ChamadoFechamento, {
  foreignKey: 'chamado_id',
  as: 'fechamento'
});

// Relacionamento: ChamadoFechamento -> SolutionCategory
ChamadoFechamento.belongsTo(SolutionCategory, {
  foreignKey: 'categoria_solucao_id',
  as: 'categoria_solucao'
});

SolutionCategory.hasMany(ChamadoFechamento, {
  foreignKey: 'categoria_solucao_id',
  as: 'fechamentos'
});

// Relacionamento: ChamadoFechamento -> Usuario
ChamadoFechamento.belongsTo(Usuario, {
  foreignKey: 'usuario_fechamento_id',
  as: 'usuario_fechamento'
});

Usuario.hasMany(ChamadoFechamento, {
  foreignKey: 'usuario_fechamento_id',
  as: 'fechamentos_realizados'
});

// Relacionamento auto-referencial: Chamado -> Chamado (Parent/Child)
Chamado.belongsTo(Chamado, {
  foreignKey: 'chamado_pai_id',
  as: 'pai'
});

Chamado.hasMany(Chamado, {
  foreignKey: 'chamado_pai_id',
  as: 'filhos'
});

// ============================================
// EXPORTAR MODELS
// ============================================

export {
  sequelize,
  Usuario,
  Grupo,
  UsuarioGrupo,
  Chamado,
  Historico,
  Comentario,
  WebhookLog,
  HistoricoAuditoria,
  TicketTimeTracking,
  SolutionCategory,
  ChamadoFechamento
};

export default {
  sequelize,
  Usuario,
  Grupo,
  UsuarioGrupo,
  Chamado,
  Historico,
  Comentario,
  WebhookLog,
  HistoricoAuditoria,
  TicketTimeTracking,
  SolutionCategory,
  ChamadoFechamento
};

