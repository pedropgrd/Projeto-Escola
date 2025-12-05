import { Injectable } from '@angular/core';

/**
 * Serviço de Utilidades
 * 
 * Contém funções reutilizáveis para formatação, validação e alertas
 */
@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }

  // ==================== MÁSCARAS E FORMATAÇÃO ====================

  /**
   * Aplica máscara de CPF (000.000.000-00)
   * @param cpf - CPF sem formatação
   * @returns CPF formatado
   */
  formatCpf(cpf: string): string {
    if (!cpf) return '';
    const numeros = this.removeNonDigits(cpf);

    if (numeros.length !== 11) return cpf;

    return `${numeros.substring(0, 3)}.${numeros.substring(3, 6)}.${numeros.substring(6, 9)}-${numeros.substring(9)}`;
  }

  /**
   * Aplica máscara de CPF parcialmente oculto (123.***.***-00)
   * @param cpf - CPF sem formatação
   * @returns CPF parcialmente mascarado
   */
  formatCpfMasked(cpf: string): string {
    if (!cpf) return '';
    const numeros = this.removeNonDigits(cpf);

    if (numeros.length !== 11) return cpf;

    return `${numeros.substring(0, 3)}.***.***-${numeros.substring(9)}`;
  }

  /**
   * Aplica máscara de telefone ((00) 00000-0000 ou (00) 0000-0000)
   * @param telefone - Telefone sem formatação
   * @returns Telefone formatado
   */
  formatTelefone(telefone: string): string {
    if (!telefone) return '';
    const numeros = this.removeNonDigits(telefone);

    if (numeros.length === 11) {
      // Celular: (00) 00000-0000
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
    } else if (numeros.length === 10) {
      // Fixo: (00) 0000-0000
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }

    return telefone;
  }

  /**
   * Aplica máscara de CEP (00000-000)
   * @param cep - CEP sem formatação
   * @returns CEP formatado
   */
  formatCep(cep: string): string {
    if (!cep) return '';
    const numeros = this.removeNonDigits(cep);

    if (numeros.length !== 8) return cep;

    return `${numeros.substring(0, 5)}-${numeros.substring(5)}`;
  }

  /**
   * Formata data no padrão brasileiro (dd/MM/yyyy)
   * @param data - Data em formato ISO ou Date
   * @returns Data formatada
   */
  formatDate(data: string | Date): string {
    if (!data) return '';

    const date = typeof data === 'string' ? new Date(data) : data;

    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  /**
   * Formata data e hora no padrão brasileiro (dd/MM/yyyy HH:mm)
   * @param data - Data em formato ISO ou Date
   * @returns Data e hora formatadas
   */
  formatDateTime(data: string | Date): string {
    if (!data) return '';

    const date = typeof data === 'string' ? new Date(data) : data;

    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Formata valor monetário (R$ 1.234,56)
   * @param valor - Valor numérico
   * @returns Valor formatado em Real
   */
  formatCurrency(valor: number): string {
    if (valor === null || valor === undefined) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Remove todos os caracteres não numéricos
   * @param texto - Texto com ou sem caracteres especiais
   * @returns Apenas números
   */
  removeNonDigits(texto: string): string {
    if (!texto) return '';
    return texto.replace(/\D/g, '');
  }

  // ==================== VALIDAÇÕES ====================

  /**
   * Valida CPF (algoritmo oficial)
   * @param cpf - CPF com ou sem formatação
   * @returns true se válido
   */
  isValidCpf(cpf: string): boolean {
    if (!cpf) return false;

    const numeros = this.removeNonDigits(cpf);

    if (numeros.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numeros)) return false;

    // Valida primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(numeros.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digito1 = resto >= 10 ? 0 : resto;

    if (digito1 !== parseInt(numeros.charAt(9))) return false;

    // Valida segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(numeros.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digito2 = resto >= 10 ? 0 : resto;

    return digito2 === parseInt(numeros.charAt(10));
  }

  /**
   * Valida e-mail
   * @param email - Endereço de e-mail
   * @returns true se válido
   */
  isValidEmail(email: string): boolean {
    if (!email) return false;

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Valida telefone brasileiro (10 ou 11 dígitos)
   * @param telefone - Telefone com ou sem formatação
   * @returns true se válido
   */
  isValidTelefone(telefone: string): boolean {
    if (!telefone) return false;

    const numeros = this.removeNonDigits(telefone);
    return numeros.length === 10 || numeros.length === 11;
  }

  /**
   * Valida CEP brasileiro (8 dígitos)
   * @param cep - CEP com ou sem formatação
   * @returns true se válido
   */
  isValidCep(cep: string): boolean {
    if (!cep) return false;

    const numeros = this.removeNonDigits(cep);
    return numeros.length === 8;
  }

  // ==================== CÁLCULOS ====================

  /**
   * Calcula idade a partir da data de nascimento
   * @param dataNascimento - Data em formato ISO ou Date
   * @returns Idade em anos
   */
  calcularIdade(dataNascimento: string | Date): number {
    if (!dataNascimento) return 0;

    const nascimento = typeof dataNascimento === 'string'
      ? new Date(dataNascimento)
      : dataNascimento;

    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
  }

  /**
   * Gera uma matrícula aleatória (formato: 2024XXXXXX)
   * @param ano - Ano para prefixo da matrícula
   * @returns Matrícula gerada
   */
  gerarMatricula(ano?: number): string {
    const anoAtual = ano || new Date().getFullYear();
    const numeroAleatorio = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${anoAtual}${numeroAleatorio}`;
  }

  // ==================== MANIPULAÇÃO DE STRINGS ====================

  /**
   * Capitaliza a primeira letra de cada palavra
   * @param texto - Texto para capitalizar
   * @returns Texto capitalizado
   */
  capitalize(texto: string): string {
    if (!texto) return '';

    return texto
      .toLowerCase()
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  }

  /**
   * Trunca texto adicionando reticências
   * @param texto - Texto para truncar
   * @param limite - Número máximo de caracteres
   * @returns Texto truncado
   */
  truncate(texto: string, limite: number = 50): string {
    if (!texto) return '';
    if (texto.length <= limite) return texto;

    return texto.substring(0, limite) + '...';
  }

  /**
   * Remove acentos de um texto
   * @param texto - Texto com acentos
   * @returns Texto sem acentos
   */
  removeAccents(texto: string): string {
    if (!texto) return '';

    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // ==================== ALERTAS CUSTOMIZADOS ====================

  /**
   * Exibe alerta de sucesso (pode ser expandido para usar biblioteca de toast)
   * @param mensagem - Mensagem de sucesso
   */
  showSuccess(mensagem: string): void {
    console.log('✅ SUCCESS:', mensagem);
    // TODO: Integrar com biblioteca de toast (ex: ngx-toastr)
    alert(`✅ Sucesso!\n\n${mensagem}`);
  }

  /**
   * Exibe alerta de erro (pode ser expandido para usar biblioteca de toast)
   * @param mensagem - Mensagem de erro
   */
  showError(mensagem: string): void {
    console.error('❌ ERROR:', mensagem);
    // TODO: Integrar com biblioteca de toast (ex: ngx-toastr)
    alert(`❌ Erro!\n\n${mensagem}`);
  }

  /**
   * Exibe alerta de aviso (pode ser expandido para usar biblioteca de toast)
   * @param mensagem - Mensagem de aviso
   */
  showWarning(mensagem: string): void {
    console.warn('⚠️ WARNING:', mensagem);
    // TODO: Integrar com biblioteca de toast (ex: ngx-toastr)
    alert(`⚠️ Atenção!\n\n${mensagem}`);
  }

  /**
   * Exibe alerta de informação (pode ser expandido para usar biblioteca de toast)
   * @param mensagem - Mensagem informativa
   */
  showInfo(mensagem: string): void {
    console.info('ℹ️ INFO:', mensagem);
    // TODO: Integrar com biblioteca de toast (ex: ngx-toastr)
    alert(`ℹ️ Informação\n\n${mensagem}`);
  }

  /**
   * Exibe diálogo de confirmação
   * @param mensagem - Mensagem de confirmação
   * @returns Promise com a resposta (true/false)
   */
  async confirm(mensagem: string, titulo: string = 'Confirmação'): Promise<boolean> {
    // TODO: Integrar com MatDialog para confirmações mais elegantes
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  }

  // ==================== UTILITÁRIOS DIVERSOS ====================

  /**
   * Copia texto para a área de transferência
   * @param texto - Texto para copiar
   */
  async copyToClipboard(texto: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(texto);
      this.showSuccess('Texto copiado para a área de transferência!');
      return true;
    } catch (err) {
      console.error('Erro ao copiar texto:', err);
      this.showError('Erro ao copiar texto.');
      return false;
    }
  }

  /**
   * Faz download de um arquivo
   * @param conteudo - Conteúdo do arquivo
   * @param nomeArquivo - Nome do arquivo
   * @param tipo - Tipo MIME do arquivo
   */
  downloadFile(conteudo: string, nomeArquivo: string, tipo: string = 'text/plain'): void {
    const blob = new Blob([conteudo], { type: tipo });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Gera um ID único (UUID simplificado)
   * @returns ID único
   */
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Espera um tempo em milissegundos (útil para delays)
   * @param ms - Tempo em milissegundos
   */
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica se o dispositivo é mobile
   * @returns true se mobile
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Obtém parâmetros da URL
   * @param param - Nome do parâmetro
   * @returns Valor do parâmetro ou null
   */
  getUrlParam(param: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  /**
   * Converte data para formato ISO (YYYY-MM-DD)
   * @param data - Data em qualquer formato
   * @returns Data no formato ISO
   */
  toISODate(data: string | Date): string {
    if (!data) return '';

    const date = typeof data === 'string' ? new Date(data) : data;

    if (isNaN(date.getTime())) return '';

    return date.toISOString().split('T')[0];
  }

  /**
   * Limpa objeto removendo propriedades null/undefined
   * @param obj - Objeto para limpar
   * @returns Objeto limpo
   */
  cleanObject<T>(obj: T): Partial<T> {
    const cleaned: any = {};

    for (const key in obj) {
      if (obj[key] !== null && obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    }

    return cleaned;
  }

  /**
   * Remove caracteres especiais, mantendo apenas números
   */
  removeFormatting(value: string): string {
    if (!value) return '';
    return value.replace(/\D/g, '');
  }
  
}
