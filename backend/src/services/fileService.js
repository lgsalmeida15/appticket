import path from 'path';
import { getFileUrl } from '../config/upload.js';
import logger from '../utils/logger.js';

/**
 * Service de Arquivos
 * Centraliza lógica de processamento e validação de arquivos
 */
class FileService {
  /**
   * Processar arquivos de upload do multer
   * @param {Array} files - Array de arquivos do multer
   * @param {Object} req - Objeto request do Express
   * @returns {Array} Array de objetos com informações dos arquivos processados
   */
  processarArquivosUpload(files, req) {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return [];
    }

    return files.map(file => ({
      nome: this.sanitizarNomeArquivo(file.originalname),
      arquivo: file.filename,
      tamanho: file.size,
      tipo: file.mimetype,
      url: getFileUrl(req, file.filename)
    }));
  }

  /**
   * Sanitizar nome de arquivo para prevenir path traversal e caracteres especiais
   * @param {String} filename - Nome original do arquivo
   * @returns {String} Nome sanitizado
   */
  sanitizarNomeArquivo(filename) {
    if (!filename) return 'arquivo';
    
    // Remover path traversal attempts
    const basename = path.basename(filename);
    
    // Remover caracteres especiais perigosos
    const sanitized = basename
      .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove caracteres perigosos
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .substring(0, 255); // Limita tamanho
    
    return sanitized || 'arquivo';
  }

  /**
   * Validar tamanho de arquivo
   * @param {Number} fileSize - Tamanho do arquivo em bytes
   * @param {Number} maxSize - Tamanho máximo permitido em bytes (padrão: 10MB)
   * @returns {Boolean} true se válido
   * @throws {Error} Se arquivo for muito grande
   */
  validarTamanhoArquivo(fileSize, maxSize = 10 * 1024 * 1024) {
    if (fileSize > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      const error = new Error(`Arquivo muito grande. Tamanho máximo permitido: ${maxSizeMB}MB`);
      error.statusCode = 400;
      error.code = 'FILE_TOO_LARGE';
      throw error;
    }
    return true;
  }

  /**
   * Validar tipo MIME de arquivo
   * @param {String} mimeType - Tipo MIME do arquivo
   * @param {Array} allowedTypes - Array de tipos MIME permitidos
   * @returns {Boolean} true se válido
   * @throws {Error} Se tipo não for permitido
   */
  validarTipoMIME(mimeType, allowedTypes = null) {
    const defaultAllowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];

    const allowed = allowedTypes || defaultAllowed;

    if (!allowed.includes(mimeType)) {
      const error = new Error(`Tipo de arquivo não permitido: ${mimeType}`);
      error.statusCode = 400;
      error.code = 'INVALID_FILE_TYPE';
      throw error;
    }
    return true;
  }

  /**
   * Validar múltiplos arquivos
   * @param {Array} files - Array de arquivos
   * @param {Object} options - Opções de validação
   * @returns {Boolean} true se todos válidos
   * @throws {Error} Se algum arquivo for inválido
   */
  validarArquivos(files, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024,
      maxFiles = 5,
      allowedTypes = null
    } = options;

    if (!files || !Array.isArray(files)) {
      return true; // Sem arquivos é válido
    }

    if (files.length > maxFiles) {
      const error = new Error(`Máximo de ${maxFiles} arquivos permitidos`);
      error.statusCode = 400;
      error.code = 'TOO_MANY_FILES';
      throw error;
    }

    files.forEach(file => {
      this.validarTamanhoArquivo(file.size, maxSize);
      this.validarTipoMIME(file.mimetype, allowedTypes);
    });

    return true;
  }

  /**
   * Calcular tamanho total de múltiplos arquivos
   * @param {Array} files - Array de arquivos
   * @returns {Number} Tamanho total em bytes
   */
  calcularTamanhoTotal(files) {
    if (!files || !Array.isArray(files)) {
      return 0;
    }
    return files.reduce((total, file) => total + (file.size || 0), 0);
  }

  /**
   * Obter extensão do arquivo
   * @param {String} filename - Nome do arquivo
   * @returns {String} Extensão do arquivo (sem o ponto)
   */
  obterExtensao(filename) {
    return path.extname(filename).toLowerCase().substring(1);
  }
}

export default new FileService();

