# 🚀 Guia Rápido - Como Executar o Projeto

## ✅ Pré-requisitos
- Node.js (versão 18 ou superior)
- npm (geralmente vem com o Node.js)

## 📦 Instalação

1. **Navegar até a pasta do projeto Angular**:
```bash
cd front-angular
```

2. **Instalar as dependências** (se ainda não instalou):
```bash
npm install
```

## 🎬 Executar o Projeto

### Modo Desenvolvimento
```bash
npm start
```
ou
```bash
ng serve
```

O projeto estará disponível em: **http://localhost:4200**

### Com porta específica
```bash
ng serve --port 4300
```

### Abrir automaticamente no navegador
```bash
ng serve --open
```

## 🌐 Páginas Disponíveis

| Página | Rota | Status |
|--------|------|--------|
| **Home** | `/` ou `http://localhost:4200` | ✅ Implementada |
| **Notícias** | `/noticias` ou `http://localhost:4200/noticias` | 🟡 Em desenvolvimento |
| **Login** | `/login` ou `http://localhost:4200/login` | 🟡 Em desenvolvimento |

## 📱 Testar Responsividade

O projeto é totalmente responsivo. Para testar:

1. Abra o projeto no navegador
2. Pressione `F12` para abrir as ferramentas de desenvolvedor
3. Clique no ícone de dispositivo móvel (📱) ou pressione `Ctrl+Shift+M` (Windows/Linux) ou `Cmd+Shift+M` (Mac)
4. Teste em diferentes tamanhos de tela:
   - Mobile: 375px
   - Tablet: 768px
   - Desktop: 1200px+

## 🔧 Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`

## 🐛 Solução de Problemas

### Erro: "Port 4200 is already in use"
```bash
# Use outra porta
ng serve --port 4300
```

### Erro: Imagens não aparecem
Verifique se as imagens foram copiadas corretamente:
```bash
ls -la public/assets/images/
```

Se estiverem faltando, copie manualmente:
```bash
cp ../Front_end/images/* public/assets/images/
```

### Erro: "Module not found"
Reinstale as dependências:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📞 Funcionalidades Testáveis

### ✅ Formulário de Contato
1. Acesse a home (`/`)
2. Role até a seção "Contato"
3. Preencha o formulário
4. Clique em "Enviar"
5. Você será redirecionado para o WhatsApp com a mensagem preenchida

### ✅ Navegação
- Clique nos links do menu para navegar entre as páginas
- Teste o menu responsivo em mobile

### ✅ Links Externos
- Instagram da escola
- WhatsApp
- Google Drive (história completa)
- Google Maps (localização)

## 📊 Comandos Úteis

```bash
# Verificar versão do Angular
ng version

# Gerar novo componente
ng generate component nome-do-componente

# Gerar novo serviço
ng generate service nome-do-servico

# Limpar cache
npm cache clean --force

# Ver todos os scripts disponíveis
npm run
```

## 🎯 Próximos Passos

1. **Implementar API de Notícias**
   - Criar serviço para consumir API do backend
   - Listar notícias na página de notícias

2. **Implementar Autenticação**
   - Conectar login com API
   - Configurar JWT
   - Proteger rotas administrativas

3. **Criar Painel Administrativo**
   - Implementar admin.html
   - CRUD de notícias
   - Gerenciamento de usuários

## 📝 Notas

- O projeto usa **Angular 18** com **Standalone Components**
- Todos os estilos foram migrados do HTML original
- As imagens devem estar em `public/assets/images/`
- Font Awesome 6.4.0 está sendo carregado via CDN

## 🆘 Ajuda

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Verifique o terminal onde o servidor está rodando
3. Consulte a documentação do Angular: https://angular.io/docs

---

**Última atualização**: 19 de novembro de 2025
