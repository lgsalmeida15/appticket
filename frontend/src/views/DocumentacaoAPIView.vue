<template>
  <div class="documentacao-api-view">
    <div class="container-fluid px-4 py-4">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h1 class="h3 mb-0">
                <i class="bi bi-book me-2"></i>
                Documentação da API - Sistema de Chamados
              </h1>
            </div>
            <div class="card-body">
              <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-3">Carregando documentação...</p>
              </div>
              <div v-else-if="error" class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Erro ao carregar documentação: {{ error }}
              </div>
              <div 
                v-else 
                class="markdown-content" 
                v-html="renderedMarkdown"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const loading = ref(true);
const error = ref(null);
const renderedMarkdown = ref('');

// Função simples para converter markdown básico para HTML
function markdownToHtml(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Horizontal rule
  html = html.replace(/^---$/gim, '<hr>');
  
  // Paragraphs (linhas que não são headers, code, etc.)
  html = html.split('\n').map(line => {
    if (line.trim() === '') return '';
    if (line.startsWith('<h') || line.startsWith('<pre') || line.startsWith('<hr')) {
      return line;
    }
    if (!line.startsWith('<')) {
      return '<p>' + line + '</p>';
    }
    return line;
  }).join('\n');
  
  return html;
}

onMounted(async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // Tentar importar o arquivo markdown usando Vite ?raw
    let markdownContent = '';
    try {
      // Tentar importação direta (Vite suporta ?raw)
      const module = await import('@/docs/api/DOCUMENTACAO_API.md?raw');
      markdownContent = module.default || module;
    } catch (importError) {
      // Fallback: tentar carregar via fetch
      try {
        const response = await fetch('/src/docs/api/DOCUMENTACAO_API.md');
        if (!response.ok) {
          throw new Error(`Erro ao carregar: ${response.status}`);
        }
        markdownContent = await response.text();
      } catch (fetchError) {
        throw new Error('Não foi possível carregar o arquivo de documentação');
      }
    }
    
    // Tentar usar marked se disponível
    try {
      const { marked } = await import('marked');
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false
      });
      renderedMarkdown.value = marked.parse(markdownContent);
    } catch {
      // Fallback para função básica
      renderedMarkdown.value = markdownToHtml(markdownContent);
    }
  } catch (err) {
    console.error('Erro ao carregar documentação:', err);
    error.value = err.message || 'Erro desconhecido';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.documentacao-api-view {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.markdown-content {
  max-width: 100%;
  line-height: 1.6;
}

.markdown-content :deep(h1) {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 2rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #dee2e6;
}

.markdown-content :deep(h2) {
  font-size: 1.75rem;
  font-weight: bold;
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
}

.markdown-content :deep(h3) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(h4) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(table) {
  width: 100%;
  margin-bottom: 1rem;
  border-collapse: collapse;
  background-color: white;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  text-align: left;
}

.markdown-content :deep(table th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

.markdown-content :deep(table tr:nth-child(even)) {
  background-color: #f8f9fa;
}

.markdown-content :deep(code) {
  background-color: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: #e83e8c;
}

.markdown-content :deep(pre) {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  overflow-x: auto;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #333;
  font-size: 0.9rem;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #0d6efd;
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 1rem;
  color: #6c757d;
  font-style: italic;
}

.markdown-content :deep(a) {
  color: #0d6efd;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(hr) {
  border: 0;
  border-top: 1px solid #dee2e6;
  margin: 2rem 0;
}
</style>
