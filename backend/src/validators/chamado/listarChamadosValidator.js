import { z } from 'zod';
import { validate } from '../index.js';

// Schema para normalizar query strings (arrays podem vir como string única ou array)
const statusEnum = z.enum(['novo', 'aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado', 'cancelado']);
const prioridadeEnum = z.enum(['baixa', 'media', 'alta', 'urgente']);
const tipoEnum = z.enum(['incidente', 'requisicao', 'problema', 'mudanca']);

const listarChamadosSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  search: z.string().optional(),
  numero_chamado: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  status: z.preprocess((val) => {
    // Express já cria array quando há múltiplos parâmetros status=novo&status=aberto
    // Se for array, validar cada item; se for string única, transformar em array
    if (val === undefined || val === null) return undefined;
    if (Array.isArray(val)) {
      const filtered = val.filter(v => v !== undefined && v !== null && v !== '' && typeof v === 'string');
      return filtered.length > 0 ? filtered : undefined;
    }
    if (typeof val === 'string' && val.trim() !== '') {
      return [val];
    }
    return undefined;
  }, z.array(statusEnum).optional()),
  prioridade: z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (Array.isArray(val)) {
      const filtered = val.filter(v => v !== undefined && v !== null && v !== '' && typeof v === 'string');
      return filtered.length > 0 ? filtered : undefined;
    }
    if (typeof val === 'string' && val.trim() !== '') {
      return [val];
    }
    return undefined;
  }, z.array(prioridadeEnum).optional()),
  tipo: z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (Array.isArray(val)) {
      const filtered = val.filter(v => v !== undefined && v !== null && v !== '' && typeof v === 'string');
      return filtered.length > 0 ? filtered : undefined;
    }
    if (typeof val === 'string' && val.trim() !== '') {
      return [val];
    }
    return undefined;
  }, z.array(tipoEnum).optional()),
  grupo_id: z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (Array.isArray(val)) {
      const filtered = val.filter(v => v !== undefined && v !== null && v !== '').map(v => typeof v === 'string' ? parseInt(v) : v).filter(v => !isNaN(v) && v > 0);
      return filtered.length > 0 ? filtered : undefined;
    }
    if (typeof val === 'string' && val.trim() !== '') {
      const parsed = parseInt(val);
      return !isNaN(parsed) && parsed > 0 ? [parsed] : undefined;
    }
    return undefined;
  }, z.array(z.number().int().positive()).optional()),
  grupo_executor_id: z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (Array.isArray(val)) {
      const filtered = val.filter(v => v !== undefined && v !== null && v !== '').map(v => typeof v === 'string' ? parseInt(v) : v).filter(v => !isNaN(v) && v > 0);
      return filtered.length > 0 ? filtered : undefined;
    }
    if (typeof val === 'string' && val.trim() !== '') {
      const parsed = parseInt(val);
      return !isNaN(parsed) && parsed > 0 ? [parsed] : undefined;
    }
    return undefined;
  }, z.array(z.number().int().positive()).optional()),
  usuario_id: z.preprocess((val) => {
    if (Array.isArray(val)) {
      return val.map(v => typeof v === 'string' ? parseInt(v) : v);
    }
    if (typeof val === 'string' && val) {
      return typeof val === 'string' ? parseInt(val) : val;
    }
    return val;
  }, z.union([
    z.number().int().positive(),
    z.array(z.number().int().positive())
  ]).optional()),
  atribuido_a: z.preprocess((val) => {
    if (val === 'null' || val === null) return null;
    if (typeof val === 'string' && val) {
      return parseInt(val);
    }
    return val;
  }, z.number().int().positive().nullable().optional())
});

export const listarChamadosValidator = validate(listarChamadosSchema, 'query');

