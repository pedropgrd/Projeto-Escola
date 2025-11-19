# Front-end Angular 18+ - Sistema de Gestão Escolar

Sistema desenvolvido com Angular 18+ utilizando standalone components e as melhores práticas mais recentes.

## 🚀 Tecnologias

- **Angular 18.2+** - Framework principal
- **TypeScript 5.5** - Linguagem de programação
- **SCSS** - Pré-processador CSS
- **RxJS 7.8** - Programação reativa
- **Standalone Components** - Nova arquitetura do Angular

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start

# Aplicação estará rodando em http://localhost:4200
```

## 🏗️ Estrutura do Projeto

```
front-angular/
├── src/
│   ├── app/
│   │   ├── core/              # Serviços core, guards, interceptors
│   │   │   ├── guards/        # Guards de rota (auth.guard.ts)
│   │   │   ├── interceptors/  # HTTP interceptors (auth.interceptor.ts)
│   │   │   └── services/      # Serviços compartilhados (auth.service.ts)
│   │   ├── features/          # Módulos de funcionalidades
│   │   │   ├── auth/          # Login e autenticação
│   │   │   ├── dashboard/     # Dashboard principal
│   │   │   ├── alunos/        # Gerenciamento de alunos
│   │   │   ├── professores/   # Gerenciamento de professores
│   │   │   └── noticias/      # Notícias e eventos
│   │   ├── shared/            # Componentes compartilhados
│   │   ├── app.component.ts   # Componente raiz
│   │   ├── app.config.ts      # Configuração da aplicação
│   │   └── app.routes.ts      # Configuração de rotas
│   ├── assets/                # Recursos estáticos
│   ├── styles.scss            # Estilos globais
│   ├── index.html             # HTML principal
│   └── main.ts                # Ponto de entrada
├── angular.json               # Configuração do Angular
├── tsconfig.json              # Configuração do TypeScript
├── proxy.conf.json            # Proxy para API backend
└── package.json               # Dependências do projeto
```

## 🔧 Configuração

### Proxy para Backend

O projeto está configurado para fazer proxy das requisições `/api` para `http://localhost:8000` (FastAPI backend).

### Rotas Principais

- `/` - Home pública
- `/login` - Página de login
- `/dashboard` - Dashboard (protegido)
- `/alunos` - Gerenciamento de alunos (protegido)
- `/professores` - Gerenciamento de professores (protegido)
- `/noticias` - Notícias e eventos

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação:
- Token é armazenado no localStorage
- Interceptor adiciona automaticamente o token nas requisições
- Guard protege rotas que requerem autenticação

## 📝 Scripts Disponíveis

```bash
npm start          # Inicia servidor de desenvolvimento
npm run build      # Build para produção
npm run watch      # Build em modo watch
npm test           # Executa testes
npm run lint       # Executa linter
```

## 🌐 Integração com Backend

O frontend se comunica com a API FastAPI em `http://localhost:8000/api/v1`:

- `POST /api/v1/auth/login` - Login
- `GET /api/v1/users/me` - Dados do usuário atual
- `GET /api/v1/alunos` - Listar alunos
- `GET /api/v1/professores` - Listar professores
- E muito mais...

## 🎨 Estilos

O projeto utiliza SCSS para estilos com uma estrutura modular:
- Estilos globais em `src/styles.scss`
- Estilos de componentes em arquivos `.scss` individuais

## 📱 Responsividade

O layout é totalmente responsivo e se adapta a diferentes tamanhos de tela.

## 🚧 Próximos Passos

Para completar o projeto, você precisará:

1. Instalar as dependências: `npm install`
2. Criar os componentes das features (já está estruturado no routes)
3. Implementar os serviços para cada módulo
4. Adicionar formulários e validações
5. Implementar listagens e CRUD completo

---

**Desenvolvido com ❤️ usando Angular 18+**
