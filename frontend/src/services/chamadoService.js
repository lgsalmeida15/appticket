import http from '../api/http.js';

/**
 * Service de chamados
 * Centraliza todas as chamadas de API relacionadas a chamados
 */
class ChamadoService {
  /**
   * Listar chamados com filtros e paginação
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);
    if (filtros.search) params.append('search', filtros.search);
    if (filtros.numero_chamado) params.append('numero_chamado', filtros.numero_chamado);
    if (filtros.status) {
      if (Array.isArray(filtros.status) && filtros.status.length > 0) {
        filtros.status.forEach(s => params.append('status', s));
      } else if (!Array.isArray(filtros.status)) {
        params.append('status', filtros.status);
      }
    }
    if (filtros.prioridade) {
      if (Array.isArray(filtros.prioridade) && filtros.prioridade.length > 0) {
        filtros.prioridade.forEach(p => params.append('prioridade', p));
      } else if (!Array.isArray(filtros.prioridade)) {
        params.append('prioridade', filtros.prioridade);
      }
    }
    if (filtros.tipo) {
      if (Array.isArray(filtros.tipo) && filtros.tipo.length > 0) {
        filtros.tipo.forEach(t => params.append('tipo', t));
      } else if (!Array.isArray(filtros.tipo)) {
        params.append('tipo', filtros.tipo);
      }
    }
    if (filtros.grupo_id) {
      if (Array.isArray(filtros.grupo_id) && filtros.grupo_id.length > 0) {
        filtros.grupo_id.forEach(g => params.append('grupo_id', g));
      } else if (!Array.isArray(filtros.grupo_id)) {
        params.append('grupo_id', filtros.grupo_id);
      }
    }
    if (filtros.grupo_executor_id) {
      if (Array.isArray(filtros.grupo_executor_id) && filtros.grupo_executor_id.length > 0) {
        filtros.grupo_executor_id.forEach(g => params.append('grupo_executor_id', g));
      } else if (!Array.isArray(filtros.grupo_executor_id)) {
        params.append('grupo_executor_id', filtros.grupo_executor_id);
      }
    }
    if (filtros.usuario_id) {
      if (Array.isArray(filtros.usuario_id) && filtros.usuario_id.length > 0) {
        filtros.usuario_id.forEach(u => params.append('usuario_id', u));
      } else if (!Array.isArray(filtros.usuario_id)) {
        params.append('usuario_id', filtros.usuario_id);
      }
    }
    if (filtros.atribuido_a) params.append('atribuido_a', filtros.atribuido_a);
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim);

    const response = await http.get(`/chamados?${params.toString()}`);
    return response.data;
  }

  /**
   * Buscar chamado por ID
   */
  async buscarPorId(id, opcoes = {}) {
    const params = new URLSearchParams();
    if (opcoes.incluirHistorico) params.append('incluirHistorico', 'true');
    if (opcoes.incluirComentarios) params.append('incluirComentarios', 'true');
    // Por padrão, relacionamentos são incluídos (não precisa passar parâmetro)
    // Mas se explicitamente false, pode passar incluirRelacionamentos=false
    if (opcoes.incluirRelacionamentos === false) {
      params.append('incluirRelacionamentos', 'false');
    }

    const queryString = params.toString();
    const url = `/chamados/${id}${queryString ? `?${queryString}` : ''}`;
    const response = await http.get(url);
    return response.data;
  }

  /**
   * Criar novo chamado
   */
  async criar(dados) {
    // Se já for FormData, enviar diretamente
    if (dados instanceof FormData) {
      const response = await http.post('/chamados', dados, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    }

    // Caso contrário, criar FormData a partir do objeto
    const formData = new FormData();
    
    // Adicionar campos do chamado
    Object.keys(dados).forEach(key => {
      // Ignorar arquivos aqui - serão adicionados depois
      if (key === 'arquivos' || key === 'anexos') {
        return;
      }
      
      // Adicionar apenas se não for undefined
      if (dados[key] !== null && dados[key] !== undefined) {
        // Objetos e arrays são convertidos para JSON
        if (typeof dados[key] === 'object' && !Array.isArray(dados[key])) {
          formData.append(key, JSON.stringify(dados[key]));
        } else if (Array.isArray(dados[key])) {
          formData.append(key, JSON.stringify(dados[key]));
        } else {
          // Valores simples são convertidos para string
          formData.append(key, String(dados[key]));
        }
      }
    });

    // Adicionar arquivos (multer espera 'arquivos' como nome do campo)
    // Priorizar 'arquivos', mas também aceitar 'anexos' para compatibilidade
    const arquivos = dados.arquivos || dados.anexos;
    if (arquivos && Array.isArray(arquivos)) {
      arquivos.forEach(arquivo => {
        if (arquivo instanceof File) {
          formData.append('arquivos', arquivo);
        }
      });
    }

    // Debug: verificar campos do FormData
    const campos = Array.from(formData.keys());
    const valores = {};
    campos.forEach(key => {
      if (key !== 'arquivos') {
        valores[key] = formData.get(key);
      } else {
        valores[key] = `${formData.getAll(key).length} arquivo(s)`;
      }
    });
    console.log('[chamadoService] FormData criado:', { campos, valores });

    const response = await http.post('/chamados', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Atualizar chamado
   */
  async atualizar(id, dados) {
    // Se já for FormData, enviar diretamente
    if (dados instanceof FormData) {
      const response = await http.put(`/chamados/${id}`, dados, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('📡 Service recebeu resposta (FormData):', response.data);
      console.log('📦 grupoExecutor na resposta:', response.data.chamado?.grupoExecutor);
      return response.data;
    }

    // Se tiver arquivos novos, criar FormData
    if (dados.arquivos && dados.arquivos.length > 0) {
      const formData = new FormData();
      
      // Adicionar campos do chamado
      Object.keys(dados).forEach(key => {
        if (key === 'arquivos' || key === 'anexos') {
          return;
        }
        
        if (dados[key] !== null && dados[key] !== undefined) {
          if (typeof dados[key] === 'object' && !Array.isArray(dados[key])) {
            formData.append(key, JSON.stringify(dados[key]));
          } else if (Array.isArray(dados[key])) {
            formData.append(key, JSON.stringify(dados[key]));
          } else {
            formData.append(key, String(dados[key]));
          }
        }
      });

      // Adicionar arquivos
      const arquivos = dados.arquivos || dados.anexos;
      if (arquivos && Array.isArray(arquivos)) {
        arquivos.forEach(arquivo => {
          if (arquivo instanceof File) {
            formData.append('arquivos', arquivo);
          }
        });
      }

      console.log('[chamadoService] Atualizando com FormData');

      const response = await http.put(`/chamados/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('📡 Service recebeu resposta (FormData com arquivos):', response.data);
      console.log('📦 grupoExecutor na resposta:', response.data.chamado?.grupoExecutor);
      return response.data;
    }

    // Caso contrário, enviar como JSON normal
    console.log('📤 Service enviando JSON:', dados);
    const response = await http.put(`/chamados/${id}`, dados);
    console.log('📡 Service recebeu resposta (JSON):', response.data);
    console.log('📦 grupoExecutor na resposta:', response.data.chamado?.grupoExecutor);
    return response.data;
  }

  /**
   * Deletar chamado (cancelar)
   */
  async deletar(id) {
    const response = await http.delete(`/chamados/${id}`);
    return response.data;
  }

  /**
   * Adicionar comentário
   */
  async adicionarComentario(chamadoId, dados) {
    const formData = new FormData();
    
    formData.append('texto', dados.texto);
    formData.append('interno', dados.interno ? 'true' : 'false');

    // Adicionar arquivos - o backend espera 'arquivos' como nome do campo
    if (dados.anexos && Array.isArray(dados.anexos)) {
      dados.anexos.forEach(arquivo => {
        if (arquivo instanceof File) {
          formData.append('arquivos', arquivo);
        }
      });
    }

    const response = await http.post(`/chamados/${chamadoId}/comentarios`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Listar comentários de um chamado
   */
  async listarComentarios(chamadoId) {
    const response = await http.get(`/chamados/${chamadoId}/comentarios`);
    return response.data;
  }

  /**
   * Buscar estatísticas
   */
  async buscarEstatisticas() {
    const response = await http.get('/chamados/estatisticas');
    return response.data;
  }

  /**
   * Iniciar contagem de tempo
   */
  async iniciarContagem(chamadoId, descricao = null) {
    const response = await http.post(`/chamados/${chamadoId}/time/start`, { descricao });
    return response.data;
  }

  /**
   * Parar contagem de tempo
   */
  async pararContagem(chamadoId) {
    const response = await http.post(`/chamados/${chamadoId}/time/stop`);
    return response.data;
  }

  /**
   * Buscar histórico de time tracking
   */
  async buscarHistoricoTimeTracking(chamadoId) {
    const response = await http.get(`/chamados/${chamadoId}/time/history`);
    return response.data;
  }

  /**
   * Associar chamado filho a um chamado pai
   */
  async associarFilho(chamadoPaiId, chamadoFilhoId) {
    const response = await http.post(`/chamados/${chamadoPaiId}/associar/${chamadoFilhoId}`);
    return response.data;
  }

  /**
   * Desassociar chamado filho do seu pai
   */
  async desassociarFilho(chamadoFilhoId) {
    const response = await http.delete(`/chamados/${chamadoFilhoId}/desassociar`);
    return response.data;
  }

  /**
   * Listar todos os filhos de um chamado pai
   */
  async listarFilhos(chamadoPaiId) {
    const response = await http.get(`/chamados/${chamadoPaiId}/filhos`);
    return response.data;
  }

  /**
   * Verificar se um chamado pai pode ser encerrado
   * Retorna informações sobre filhos ativos (se houver)
   */
  async verificarPodeEncerrar(chamadoId) {
    const response = await http.get(`/chamados/${chamadoId}/pode-encerrar`);
    return response.data;
  }
}

export default new ChamadoService();


