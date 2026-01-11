/**
 * Testes unitários para chamadoService
 */
import chamadoService from '../../../src/services/chamadoService.js';
import chamadoRepository from '../../../src/repositories/chamadoRepository.js';

// Mockar repositories
jest.mock('../../../src/repositories/chamadoRepository.js');
jest.mock('../../../src/repositories/grupoRepository.js');
jest.mock('../../../src/repositories/usuarioRepository.js');
jest.mock('../../../src/services/historicoService.js');
jest.mock('../../../src/services/auditoriaService.js');
jest.mock('../../../src/services/slaService.js');
jest.mock('../../../src/services/webhookService.js');

describe('ChamadoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('deve listar chamados com filtros', async () => {
      const mockChamados = [
        { id: 1, titulo: 'Chamado 1', toJSON: () => ({ id: 1, titulo: 'Chamado 1' }) }
      ];

      chamadoRepository.listar = jest.fn().mockResolvedValue({
        chamados: mockChamados,
        total: 1,
        page: 1,
        totalPages: 1
      });

      const usuarioLogado = { id: 1, tipo: 'admin' };
      const filtros = { page: 1, limit: 10 };

      const resultado = await chamadoService.listar(filtros, usuarioLogado);

      expect(resultado).toHaveProperty('chamados');
      expect(resultado).toHaveProperty('total');
      expect(resultado.total).toBe(1);
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar chamado por ID', async () => {
      const mockChamado = {
        id: 1,
        titulo: 'Chamado 1',
        toJSON: () => ({ id: 1, titulo: 'Chamado 1' })
      };

      chamadoRepository.buscarPorId = jest.fn().mockResolvedValue(mockChamado);

      const usuarioLogado = { id: 1, tipo: 'admin' };
      const resultado = await chamadoService.buscarPorId(1, usuarioLogado);

      expect(resultado).toHaveProperty('id');
      expect(resultado.id).toBe(1);
    });

    it('deve lançar erro se chamado não encontrado', async () => {
      chamadoRepository.buscarPorId = jest.fn().mockResolvedValue(null);

      const usuarioLogado = { id: 1, tipo: 'admin' };

      await expect(
        chamadoService.buscarPorId(999, usuarioLogado)
      ).rejects.toThrow('Chamado não encontrado');
    });
  });

  describe('criar', () => {
    it('deve criar novo chamado', async () => {
      const mockChamado = {
        id: 1,
        titulo: 'Novo Chamado',
        toJSON: () => ({ id: 1, titulo: 'Novo Chamado' })
      };

      // Mockar todas as dependências
      const grupoRepository = await import('../../../src/repositories/grupoRepository.js');
      grupoRepository.default.buscarPorId = jest.fn().mockResolvedValue({
        id: 1,
        nome: 'Grupo 1',
        ativo: true
      });
      grupoRepository.default.usuarioPertenceAoGrupo = jest.fn().mockResolvedValue(true);

      chamadoRepository.criar = jest.fn().mockResolvedValue(mockChamado);
      chamadoRepository.buscarPorId = jest.fn().mockResolvedValue(mockChamado);

      const dados = {
        titulo: 'Novo Chamado',
        descricao: 'Descrição',
        grupo_id: 1
      };

      const resultado = await chamadoService.criar(dados, 1);

      expect(resultado).toHaveProperty('id');
      expect(chamadoRepository.criar).toHaveBeenCalled();
    });
  });
});

