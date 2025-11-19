# Front-end Angular 18+ - Sistema de Gestão Escolar 🎓

Sistema desenvolvido com Angular 18+ utilizando standalone components, Signals e as melhores práticas mais recentes.

## 🚀 Tecnologias

- **Angular 18.2+** - Framework principal
- **TypeScript 5.5** - Linguagem de programação
- **SCSS** - Pré-processador CSS
- **RxJS 7.8** - Programação reativa
- **Standalone Components** - Nova arquitetura do Angular
- **Signals** - Sistema de reatividade moderno do Angular

## � Sistema de Autenticação e Segurança

### ✨ Funcionalidades Implementadas

- ✅ Login/Logout com JWT
- ✅ Interceptor automático de tokens
- ✅ Guards funcionais para controle de acesso (RBAC)
- ✅ Decodificação automática de JWT
- ✅ Suporte a 3 perfis: ADMIN, PROFESSOR, ALUNO
- ✅ BehaviorSubject + Signals para estado reativo
- ✅ Tratamento global de erros 401/403
- ✅ Logout automático em caso de token expirado

### 📚 Documentação

- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - Guia completo de segurança e autenticação
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumo da implementação
- **[SNIPPETS.md](./SNIPPETS.md)** - Exemplos práticos e receitas

## �📦 Instalação

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
│   │   ├── core/                    # Serviços core, guards, interceptors
│   │   │   ├── guards/              
│   │   │   │   └── auth.guard.ts    # ✅ Guards funcionais (NOVO)
│   │   │   ├── interceptors/        
│   │   │   │   └── auth.interceptor.ts  # ✅ Interceptor JWT (NOVO)
│   │   │   ├── services/            
│   │   │   │   ├── api.service.ts   # ✅ HTTP genérico (NOVO)
│   │   │   │   └── auth.service.ts  # ✅ Autenticação (ATUALIZADO)
│   │   │   └── models/              
│   │   │       └── auth.models.ts   # ✅ Interfaces e types (NOVO)
│   │   ├── pages/                   # Páginas da aplicação
│   │   │   ├── home/                
│   │   │   ├── login/               # ✅ Atualizado com novos services
│   │   │   └── noticias/            
│   │   ├── components/              # Componentes compartilhados
│   │   │   ├── header/              # ✅ Menu condicional por perfil
│   │   │   └── footer/              
│   │   ├── shared/                  # Utilitários compartilhados
│   │   ├── examples/                # ✅ Exemplos de uso (NOVO)
│   │   │   └── api-usage.example.ts 
│   │   ├── app.component.ts         # Componente raiz
│   │   ├── app.config.ts            # Configuração da aplicação
│   │   └── app.routes.ts            # Configuração de rotas
│   ├── environments/                # ✅ Configurações de ambiente (NOVO)
│   │   ├── environment.ts           
│   │   └── environment.prod.ts      
│   ├── assets/                      # Recursos estáticos
│   ├── styles.scss                  # Estilos globais
│   ├── index.html                   # HTML principal
│   └── main.ts                      # Ponto de entrada
├── SECURITY_GUIDE.md                # ✅ Guia de segurança (NOVO)
├── IMPLEMENTATION_SUMMARY.md        # ✅ Resumo da implementação (NOVO)
├── SNIPPETS.md                      # ✅ Snippets úteis (NOVO)
├── angular.json                     # Configuração do Angular
├── tsconfig.json                    # Configuração do TypeScript
```
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
