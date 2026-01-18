/**
 * Validações utilitárias para o sistema
 */

/**
 * Valida data_hora_inicio antes de salvar
 * @param {Date} data_hora_inicio - Data/hora de início a ser validada
 * @param {Date} created_at - Data de criação do chamado
 * @returns {{valido: boolean, erro?: string}} - Resultado da validação
 */
export function validarDataHoraInicio(data_hora_inicio, created_at) {
  const agora = new Date();
  
  // Não pode ser data futura
  if (data_hora_inicio > agora) {
    return {
      valido: false,
      erro: 'Data/hora de início não pode ser futura'
    };
  }
  
  // Não pode ser posterior ao created_at
  if (data_hora_inicio > created_at) {
    return {
      valido: false,
      erro: 'Data/hora de início não pode ser posterior à data de criação do chamado'
    };
  }
  
  return { valido: true };
}

export default {
  validarDataHoraInicio
};

