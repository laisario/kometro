# 📚 Documentação Técnica - KOMETRO

Sistema de Gestão Metrológica desenvolvido para B&F Laboratório de Metrologia.

---

## 📋 Índice

1. [Visão Geral do Projeto](#-visão-geral-do-projeto)
2. [Estrutura do Monorepo](#-estrutura-do-monorepo)
3. [Backend - Módulos e Relacionamentos](#-backend---módulos-e-relacionamentos)
4. [Frontend - Estrutura e Rotas](#-frontend---estrutura-e-rotas)
5. [Landing Page](#-landing-page)
6. [Workflows e Tarefas Automatizadas](#-workflows-e-tarefas-automatizadas)
7. [Como Subir o Projeto (Desenvolvimento)](#-como-subir-o-projeto-desenvolvimento)
8. [Variáveis de Ambiente](#-variáveis-de-ambiente)
9. [API - Rotas e Endpoints](#-api---rotas-e-endpoints)
10. [Fluxo de Autenticação](#-fluxo-de-autenticação)
11. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral do Projeto

O **KOMETRO** é uma plataforma completa para gestão metrológica que digitaliza e automatiza processos de controle de instrumentos de medição, calibrações, documentos e propostas comerciais.

### Principais Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| **Gestão de Instrumentos** | Cadastro, controle de calibração, alertas de vencimento |
| **Gestão de Documentos** | Versionamento (só salva a versão mais recente do documento), workflow de aprovação, controle de validade |
| **Propostas Comerciais** | Geração automática de PDFs, envio por email |
| **Dashboard** | Métricas e indicadores de desempenho |
| **Notificações Automáticas** | Emails de aviso de vencimento e aprovações pendentes |

---

## 📁 Estrutura do Monorepo

```
kometro/
├── bef-backend/          # API REST + Workers (Django REST Framework)
│   ├── app/              # Código fonte do Django
│   │   ├── clientes/     # Módulo de usuários e empresas
│   │   ├── instrumentos/ # Módulo de instrumentos e calibrações
│   │   ├── documentos/   # Módulo de documentos e revisões
│   │   ├── propostas/    # Módulo de propostas comerciais
│   │   ├── procedimentos/# Procedimentos técnicos
│   │   ├── avaliacoes/   # Avaliações/depoimentos
│   │   ├── blog/         # Posts educativos
│   │   ├── equipamentos/ # Catálogo de equipamentos
│   │   ├── enderecos/    # Gestão de endereços
│   │   └── rkp_platform/ # Configurações do Django
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/             # SPA Web Application (React + Vite)
│   ├── src/
│   │   ├── access/       # Gestão de acessos/convites
│   │   ├── assets/       # Módulo de instrumentos
│   │   ├── auth/         # Autenticação
│   │   ├── clients/      # Gestão de clientes (admin)
│   │   ├── components/   # Componentes compartilhados
│   │   ├── dashboard/    # Dashboard principal
│   │   ├── documents/    # Gestão de documentos
│   │   ├── proposals/    # Propostas comerciais
│   │   ├── layouts/      # Layouts de páginas
│   │   └── routes/       # Roteamento
│   └── package.json
│
├── bef-landing-page/     # Landing Page (Next.js)
│   ├── pages/            # Páginas do Next.js
│   ├── content/          # Conteúdo em Markdown
│   └── package.json
│
└── README.md
```

---

## ⚙️ Backend - Módulos e Relacionamentos

### Diagrama de Relacionamentos

```
                    ┌─────────────────┐
                    │     User        │
                    │   (Django)      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   UserProfile   │
                    │ (terms_accepted)│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│    Cliente     │  │    Convite     │  │ PasswordReset  │
│  (empresa FK)  │  │ (cliente FK)   │  │                │
└───────┬────────┘  └────────────────┘  └────────────────┘
        │
        ├────────────────────┬────────────────────┬─────────────────┐
        │                    │                    │                 │
        ▼                    ▼                    ▼                 ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐  ┌────────────┐
│ Instrumento   │   │   Proposta    │   │   Documento   │  │   Setor    │
│  DoCliente    │   │               │   │               │  │            │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘  └────────────┘
        │                   │                   │
        ▼                   │                   ▼
┌───────────────┐           │           ┌───────────────┐
│  Calibração   │◄──────────┘           │    Revisão    │
└───────┬───────┘                       └───────┬───────┘
        │                                       │
        ▼                                       ▼
┌───────────────┐                       ┌───────────────┐
│  Certificado  │                       │   Aprovação   │
└───────────────┘                       └───────────────┘
```

### 📦 Módulo: `clientes`

Gerencia usuários, empresas e controle de acesso.

**Models:**

| Model | Descrição | Campos Principais |
|-------|-----------|-------------------|
| `UserProfile` | Perfil extra do usuário | `user (FK User)`, `terms_accepted` |
| `Empresa` | Dados da empresa | `razao_social`, `cnpj`, `ie`, `nome_fantasia` |
| `Unidade` | Unidades da empresa | `nome`, `empresa (FK)` |
| `Cliente` | Cliente principal do sistema | `empresa (FK)`, `endereco (FK)`, `usuarios (M2M User)`, `criterio_frequencia_padrao` |
| `Convite` | Convites para novos usuários | `token_jti`, `grupo (FK Group)`, `cliente (FK)`, `usado` |
| `PasswordReset` | Reset de senha | `email`, `token`, `created_at` |

**Relacionamentos Importantes:**
- Um `Cliente` (empresa) pode ter múltiplos `User` (funcionários) através de relação M2M
- `Cliente` possui contadores cached: `instrumentos_vencidos`, `instrumentos_em_dia`, `propostas_aguardando_aprovacao`

---

### 🔧 Módulo: `instrumentos`

Módulo central para gestão de instrumentos de medição.

**Models:**

| Model | Descrição |
|-------|-----------|
| `TipoInstrumento` | Catálogo de tipos (descrição, modelo, fabricante, resolução) |
| `Instrumento` | Especificações técnicas (min, max, unidade, preços, tipo de serviço) |
| `InstrumentoDoCliente` | Instância do instrumento vinculado a um cliente |
| `Calibracao` | Registro de calibração/checagem realizada |
| `Certificado` | Arquivo do certificado de calibração |
| `Setor` | Setores do cliente (hierárquico com `setor_pai`) |
| `Frequencia` | Frequência de calibração (quantidade + período) |
| `Normativo` | Normas aplicáveis ao instrumento |
| `CriterioAceitacao` | Critérios de aceitação de calibração |
| `ResultadoCalibracao` | Resultados (maior erro, incerteza, status) |
| `MovimentacaoInstrumento` | Histórico de mudanças de posição |
| `MovimentacaoSetorInstrumento` | Histórico de mudanças de setor |

**Campos Importantes de `InstrumentoDoCliente`:**

| Campo | Descrição |
|-------|-----------|
| `tag` | Identificador único do cliente |
| `numero_de_serie` | Número de série do fabricante |
| `posicao` | Em uso, estoque, inativo, fora de uso, em calibração |
| `data_proxima_calibracao` | Data calculada automaticamente |
| `data_ultima_calibracao` | Data da última calibração |
| `expirado` | Boolean indicando se está vencido |
| `criterio_frequencia` | Calendário ou Tempo de Serviço |
| `setor` | Setor onde está localizado |

**Relacionamento com Calibrações/Checagens:**
- Um `InstrumentoDoCliente` pode ter múltiplas `Calibracao` (histórico completo)
- A model `Calibracao` representa tanto **calibrações** quanto **checagens** (diferenciado pelo campo `checagem: Boolean`)
- Cada calibração/checagem possui seus próprios certificados e resultados

**Lógica de Cálculo de Próxima Calibração:**

```python
# Critério: CALENDÁRIO
data_proxima = data_ultima_calibracao + frequencia

# Critério: SERVIÇO (só conta quando em uso)
data_proxima = data_inicio_uso + tempo_acumulado + frequencia
```

---

### 📄 Módulo: `documentos`

Gestão de documentos com versionamento e workflow de aprovação.

**Models:**

| Model | Descrição |
|-------|-----------|
| `DocumentoExterno` | Referência a documentos externos (links) |
| `Documento` | Documento controlado do SGQ |
| `Revisao` | Revisão ou revalidação de documento |
| `Aprovacao` | Registro de aprovação por usuário |

**Campos de `Documento`:**

| Campo | Descrição |
|-------|-----------|
| `codigo` | Código do procedimento (FK) |
| `titulo` | Título do documento |
| `status` | Vigente, Obsoleto ou Cancelado |
| `data_validade` | Data de expiração |
| `frequencia` | Frequência de revisão (em anos) |
| `arquivo` | Arquivo do documento |
| `criador` | Responsável pelo documento |

**Workflow de Aprovação:**

```
1. Revisor cria REVISÃO (tipo: revisar/revalidar)
2. Define APROVADORES (M2M)
3. Cada aprovador cria APROVAÇÃO
4. Quando todos aprovam → fica registrado no sistema (histórico)
5. Data de validade do documento é recalculada (frequencia * 365 dias)
```

> **Nota:** As aprovações ficam registradas para fins de auditoria e rastreabilidade.

---

### 📝 Módulo: `propostas`

Gestão de propostas comerciais com geração de PDF.

**Models:**

| Model | Descrição |
|-------|-----------|
| `Proposta` | Proposta comercial principal |
| `Revisao` | Revisões do PDF da proposta |
| `Anexo` | Arquivos anexos à proposta |

**Campos de `Proposta`:**

| Campo | Descrição |
|-------|-----------|
| `numero` | Número gerado automaticamente (ex: 0001A25) |
| `cliente` | Cliente da proposta |
| `instrumentos` | Instrumentos incluídos (M2M) |
| `total` | Valor total |
| `status` | Elaboração, Aguardando aprovação, Aprovada, Reprovada |
| `local` | Instalação permanente, cliente ou terceirizada |
| `desconto_percentual` | Desconto aplicado |

**Geração de Número:**
```python
# Formato: NNNNMY (sequência + mês letra + ano)
# Exemplo: 0001A25 → proposta 1, Janeiro, 2025
```

---

### 📋 Módulo: `procedimentos`

Procedimentos técnicos do sistema de gestão.

> ⚠️ **Em Desenvolvimento:** Atualmente só é possível cadastrar procedimentos através do **Django Admin**. A interface no frontend ainda não foi implementada.

**Model `Procedimento`:**
- `codigo` - Código do procedimento
- `descricao` - Descrição
- `objetivo` - Objetivo
- `responsabilidade` - Quem é responsável
- `procedimentos_relacionados` - Auto-referência
- `documentos_de_referencia` - Links externos

---

### ⭐ Módulo: `avaliacoes`

Depoimentos de clientes para landing page.

**Model `Avaliacao`:**
- `nome` - Nome do avaliador
- `empresa` - Empresa
- `foto` - Foto
- `comentario` - Texto do depoimento

---

### 📰 Módulo: `blog`

Conteúdo educativo (integrado com landing page).

**Models:**
- `Categoria` - Categorias de posts
- `Post` - Artigos com RichTextField
- `ImagemExtra` - Imagens adicionais
- `Video` - URLs de vídeos

---

### 🛠️ Módulo: `equipamentos`

Catálogo de equipamentos do laboratório.

**Models:**
- `Categoria` - Categorias de equipamentos
- `Equipamento` - Equipamento com descrição, manual, vídeo
- `EquipamentoImagem` - Imagens do equipamento
- `EquipamentoCaracteristica` - Características técnicas

---

### 📍 Módulo: `enderecos`

Gestão de endereços.

**Models:**
- `UF` - Estados (sigla)
- `Cidade` - Cidades (FK UF)
- `Bairro` - Bairros (FK Cidade)
- `Endereco` - Endereço completo (CEP, número, logradouro, complemento)

---

## 💻 Frontend - Estrutura e Rotas

### Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| **React 18** | Biblioteca de UI |
| **Vite** | Build tool |
| **Material-UI (MUI)** | Componentes visuais |
| **React Query** | Cache e state management |
| **React Router v7** | Roteamento |
| **React Hook Form** | Formulários |
| **Axios** | Requisições HTTP |

### Estrutura de Pastas

```
src/
├── access/           # Módulo de convites e controle de acesso
│   ├── components/   # InviteGenerator, InviteList
│   ├── hooks/        # useGroups, useInvites
│   └── pages/        # UserAccessPage
│
├── assets/           # Módulo de instrumentos
│   ├── components/   # AssetCard, CalibrationCard, SetorTree...
│   ├── hooks/        # useAsset, useAssets, useSectorTree...
│   ├── pages/        # AssetsPage, AssetDetailPage
│   └── viewModels/   # useAssetsVM
│
├── auth/             # Autenticação
│   ├── components/   # FormAddress, PasswordStrengthMeter
│   ├── context/      # Context de autenticação
│   ├── hooks/        # useAuth, useCEP, useCNPJ...
│   ├── pages/        # LoginPage, RegisterPages...
│   └── viewModels/   # useLoginVM, useBasicInfoVM...
│
├── clients/          # Gestão de clientes (admin)
│   ├── components/   # Calibration, Form...
│   ├── hooks/        # useClient, useClients
│   └── pages/        # ClientsPage, ClientDetailsPage
│
├── documents/        # Gestão de documentos
│   ├── components/   # DocumentCard, RevisionsList...
│   ├── hooks/        # useDocument, useRevisions
│   └── pages/        # DocumentsPage, DocumentDetailPage
│
├── proposals/        # Propostas comerciais
│   ├── components/   # ProposalCard, InstrumentSelector...
│   ├── hooks/        # useProposal, useProposals
│   └── pages/        # ProposalsPage, ProposalDetailsPage
│
├── dashboard/        # Dashboard principal
│   ├── components/   # StatCards, Charts...
│   └── pages/        # DashboardPage
│
├── components/       # Componentes compartilhados
├── layouts/          # Layouts (auth, common, simple)
├── theme/            # Tema MUI customizado
├── utils/            # Funções utilitárias
└── routes/           # MainRouter.jsx
```

### Rotas da Aplicação

#### Rotas Públicas (AuthLayout)

| Rota | Página | Descrição |
|------|--------|-----------|
| `/login` | LoginPage | Tela de login |
| `/reset-password-request` | ResetPasswordRequestPage | Solicitar reset de senha |
| `/reset-password/:token` | ResetPasswordPage | Redefinir senha |
| `/register/basics` | RegisterBasicsPage | Cadastro - dados básicos |
| `/register/auth` | RegisterAuthPage | Cadastro - autenticação |
| `/register/location` | RegisterLocationPage | Cadastro - endereço |
| `/register/invite/:token` | RegisterFromInvite | Cadastro via convite |

#### Rotas do Cliente (CommonLayout - /dashboard)

| Rota | Página | Descrição |
|------|--------|-----------|
| `/dashboard/app` | DashboardPage | Dashboard principal |
| `/dashboard/instrumentos` | AssetsPage | Lista de instrumentos |
| `/dashboard/instrumentos/:id/:idSetor` | AssetsPage | Instrumentos por setor |
| `/dashboard/propostas` | ProposalsPage | Lista de propostas |
| `/dashboard/proposta/:id` | ProposalDetailsPage | Detalhes da proposta |
| `/dashboard/documentos` | DocumentsPage | Lista de documentos |
| `/dashboard/documento/:id/:idRevisao` | DocumentDetailPage | Detalhes do documento |
| `/dashboard/documento/:id/revisoes` | DocumentReviews | Histórico de revisões |
| `/dashboard/acessos` | UserAccessPage | Gestão de convites |

#### Rotas do Admin (CommonLayout - /admin)

| Rota | Página | Descrição |
|------|--------|-----------|
| `/admin/app` | DashboardPage | Dashboard admin |
| `/admin/clientes` | ClientsPage | Lista de clientes |
| `/admin/cliente/:id` | ClientDetailsPage | Detalhes do cliente |
| `/admin/propostas` | ProposalsPage | Propostas (todos clientes) |
| `/admin/proposta/:id/:idClient` | ProposalDetailsPage | Detalhes proposta + cliente |
| `/admin/documentos` | DocumentsPage | Documentos (admin) |
| `/admin/acessos` | UserAccessPage | Gestão de acessos |

---

## 🌐 Landing Page

### Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| **Next.js 13** | Framework React |
| **Tailwind CSS** | Estilização |
| **MDX** | Conteúdo em Markdown |

### Estrutura

```
bef-landing-page/
├── pages/
│   ├── index.js            # Página inicial
│   ├── conhecimento/       # Blog/artigos
│   ├── servicos/           # Serviços oferecidos
│   ├── contato.js          # Formulário de contato
│   └── lgpd.js             # Política de privacidade
├── content/
│   ├── _index.md           # Conteúdo da home
│   └── servicos/           # Páginas de serviços
└── layouts/
    └── components/         # Componentes React
```

### Como Rodar

```bash
cd bef-landing-page
npm install
npm run dev
# Acesso: http://localhost:3000
```

---

## ⏰ Workflows e Tarefas Automatizadas

O sistema usa **Celery** para processamento assíncrono e **Celery Beat** para tarefas agendadas.

### Tarefas Agendadas (Celery Beat)

| Tarefa | Módulo | Horário | Descrição |
|--------|--------|---------|-----------|
| `expires_instruments` | instrumentos | 04:00 | Marca instrumentos vencidos |
| `expires_documents` | documentos | 01:00 | Marca documentos vencidos |
| `update_clients` | clientes | 06:00 | Atualiza contadores dos clientes |
| `enviar_emails_instrumentos_expirados` | instrumentos | 09:00 | Email de instrumentos vencidos |
| `enviar_emails_aviso_expiracao_instrumentos` | instrumentos | 09:00 | Aviso 30 dias antes |
| `enviar_emails_documentos_expirados` | documentos | 09:00 | Email de documentos vencidos |
| `notificar_aprovacao_revisoes` | documentos | 09:00 | Lembrete de aprovações pendentes |

### Fluxo de Notificações

```
┌────────────────────────────────────────────────────────────────┐
│                    INSTRUMENTOS                                 │
├────────────────────────────────────────────────────────────────┤
│  30 dias antes  →  Email "Aviso de Expiração em 30 dias"       │
│  No dia         →  Email "Calibração expira hoje"              │
│  Após vencer    →  Email a cada 15 dias "Calibração vencida"   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    DOCUMENTOS                                   │
├────────────────────────────────────────────────────────────────┤
│  Vencido        →  Email a cada 2 dias para o criador          │
│  Revisão pend.  →  Email a cada 2 dias para aprovadores        │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Subir o Projeto (Desenvolvimento)

### Pré-requisitos

- **Docker** e **Docker Compose**
- **Node.js** 18+
- **Git**

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd kometro
```

### 2. Subir o Backend (Docker)

```bash
cd bef-backend

# Criar arquivo de variáveis de ambiente
cat > .env << 'EOF'
DEBUG=True
SECRET_KEY=sua-chave-secreta-aqui-mude-em-producao

# Banco de Dados MySQL
MYSQL_HOST=db
MYSQL_USER=kometro
MYSQL_PASSWORD=kometro123
MYSQL_NAME=kometro

# Redis/Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Email (configure com credenciais reais para envio)
EMAIL_HOST_USER=seu-email@dominio.com
EMAIL_HOST_PASSWORD=sua-senha
DEFAULT_FROM_EMAIL=noreply@kometro.com.br

# Storage DigitalOcean Spaces (S3 compatível)
DIGITAL_OCEAN_ACCESS_KEY_ID=sua-access-key
DIGITAL_OCEAN_SECRET_ACCESS_KEY=sua-secret-key

# URL do site
SITE=http://localhost:8000

# GitHub Actions (opcional, para rebuild da landing page)
GITHUB_REBUILD_LANDINGPAGE_TOKEN=seu-token
EOF

# Subir os containers
docker compose up --build
```

**Serviços que sobem:**
- `db` - MySQL 8.0 (porta 3306)
- `redis` - Redis Alpine (porta 6379)
- `web` - Django API (porta 8000)
- `celery_worker` - Processamento de tarefas
- `celery_beat` - Agendador de tarefas

### 3. Criar Superusuário (Admin Django)

```bash
docker exec -it web python manage.py createsuperuser
```

Acesse o admin em: `http://localhost:8000/admin`

### 4. Subir o Frontend

```bash
cd ../frontend

npm install

# Configurar API URL (desenvolvimento)
cat > public/env.js << 'EOF'
window.env = {
  "API_URL": "http://localhost:8000"
};
EOF

npm run dev
```

Acesse: `http://localhost:5173`

### 5. Subir a Landing Page (Opcional)

```bash
cd ../bef-landing-page
npm install
npm run dev
```

Acesse: `http://localhost:3000`

---

## 🔐 Variáveis de Ambiente

### Backend (.env)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DEBUG` | Modo debug | `True` |
| `SECRET_KEY` | Chave secreta Django | `minha-chave-secreta` |
| `MYSQL_HOST` | Host do MySQL | `db` (docker) ou `localhost` |
| `MYSQL_USER` | Usuário MySQL | `kometro` |
| `MYSQL_PASSWORD` | Senha MySQL | `kometro123` |
| `MYSQL_NAME` | Nome do banco | `kometro` |
| `CELERY_BROKER_URL` | URL do Redis | `redis://redis:6379/0` |
| `CELERY_RESULT_BACKEND` | Backend de resultados | `redis://redis:6379/0` |
| `EMAIL_HOST_USER` | Usuário SMTP | `email@dominio.com` |
| `EMAIL_HOST_PASSWORD` | Senha SMTP | `senha` |
| `DEFAULT_FROM_EMAIL` | Email remetente | `noreply@kometro.com.br` |
| `DIGITAL_OCEAN_ACCESS_KEY_ID` | Access key DO Spaces | `DO00...` |
| `DIGITAL_OCEAN_SECRET_ACCESS_KEY` | Secret key DO Spaces | `...` |
| `SITE` | URL base do site | `http://localhost:8000` |

### Frontend (public/env.js)

```javascript
window.env = {
  "API_URL": "http://localhost:8000"  // URL da API
};
```

---

## 🔌 API - Rotas e Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/login/` | Login (retorna tokens JWT) |
| `POST` | `/refresh-token/` | Renovar access token |
| `POST` | `/register/basics/` | Cadastro - dados básicos |
| `POST` | `/register/location/` | Cadastro - endereço |
| `POST` | `/register/auth/` | Cadastro - autenticação |
| `GET` | `/invites/register/<token>/` | Info do convite |
| `POST` | `/invites/register/<token>/` | Cadastro via convite |
| `POST` | `/reset-password-request/` | Solicitar reset |
| `POST` | `/reset-password/<token>/` | Redefinir senha |

### Recursos REST (ViewSets)

Todos os endpoints seguem o padrão REST do Django Rest Framework:

| Recurso | Base URL | Operações |
|---------|----------|-----------|
| Instrumentos (cliente) | `/instrumentos/` | list, retrieve, create, update, delete |
| Instrumentos (catálogo) | `/instrumentos-empresa/` | list, retrieve |
| Calibrações | `/calibracoes/` | list, retrieve, create, update, delete |
| Setores | `/setores/` | list, retrieve, create, update, delete |
| Normativos | `/normativos/` | list, retrieve, create, update, delete |
| Propostas | `/propostas/` | list, retrieve, create, update, delete |
| Arquivos de proposta | `/propostas-files/` | list, retrieve, create, delete |
| Clientes | `/clientes/` | list, retrieve, update |
| Documentos | `/documentos/` | list, retrieve, create, update, delete |
| Revisões | `/revisoes/` | list, retrieve, create, update |
| Procedimentos | `/procedimentos/` | list, retrieve |
| Dashboard | `/dashboard/` | métricas |
| Usuários | `/users/` | list, retrieve, update |
| Grupos | `/grupos/` | list |
| Convites | `/convites/` | list, retrieve, create, delete |
| Avaliações | `/avaliacoes/` | list, retrieve |
| Posts (blog) | `/posts/` | list, retrieve |
| Categorias | `/categorias/` | list |
| Equipamentos | `/equipamentos/` | list, retrieve |
| Cat. Equipamentos | `/categorias-equipamentos/` | list |

### Filtros Disponíveis

Os endpoints suportam filtros via query params:

```bash
# Instrumentos
GET /instrumentos/?expirado=true
GET /instrumentos/?setor=1
GET /instrumentos/?search=termometro

# Propostas
GET /propostas/?status=E
GET /propostas/?cliente=1

# Documentos
GET /documentos/?vencido=true
GET /documentos/?status=V
```

---

## 🔐 Fluxo de Autenticação

### Login

```
┌─────────┐        ┌─────────┐        ┌─────────┐
│ Frontend│        │   API   │        │   DB    │
└────┬────┘        └────┬────┘        └────┬────┘
     │   POST /login/   │                  │
     │ {email, password}│                  │
     │─────────────────>│                  │
     │                  │  Validate user   │
     │                  │─────────────────>│
     │                  │<─────────────────│
     │                  │                  │
     │  {access, refresh│                  │
     │   tokens + user} │                  │
     │<─────────────────│                  │
     │                  │                  │
     │ Store tokens in  │                  │
     │ localStorage     │                  │
```

### Requisições Autenticadas

```
┌─────────┐        ┌─────────┐
│ Frontend│        │   API   │
└────┬────┘        └────┬────┘
     │ GET /instrumentos/│
     │ Authorization:    │
     │ Bearer <token>    │
     │──────────────────>│
     │                   │
     │  JSON Response    │
     │<──────────────────│
```

### Refresh Token

O token expira em 15 dias. Quando expira:

```javascript
// Frontend intercepta erro 401
// Chama POST /refresh-token/ com refresh_token
// Obtém novo access_token
// Repete a requisição original
```

---

## 🔧 Troubleshooting

### Container não sobe

```bash
# Ver logs
docker compose logs web

# Verificar se MySQL está pronto
docker compose logs db

# Reiniciar tudo
docker compose down -v
docker compose up --build
```

### Erro de conexão com banco

```bash
# Verificar se db está rodando
docker compose ps

# Acessar MySQL diretamente
docker exec -it db mysql -u kometro -p
```

### Frontend não conecta na API

1. Verificar se backend está rodando: `http://localhost:8000/admin`
2. Verificar `public/env.js`:
   ```javascript
   window.env = { "API_URL": "http://localhost:8000" };
   ```
3. Verificar CORS no backend (`settings.py`)

### Emails não são enviados

1. Verificar credenciais SMTP no `.env`
2. Ver logs do Celery:
   ```bash
   docker compose logs celery_worker
   ```
3. Testar envio manual:
   ```bash
   docker exec -it web python manage.py shell
   >>> from django.core.mail import send_mail
   >>> send_mail('Test', 'Body', 'from@email.com', ['to@email.com'])
   ```

### Tarefas Celery não executam

```bash
# Ver status dos workers
docker exec -it celery_worker celery -A rkp_platform inspect active

# Ver tarefas agendadas
docker exec -it celery_beat celery -A rkp_platform beat --loglevel=debug
```

---

## 📝 Comandos Úteis

### Backend

```bash
# Rodar migrations
docker exec -it web python manage.py migrate

# Criar superusuário
docker exec -it web python manage.py createsuperuser

# Shell Django
docker exec -it web python manage.py shell

# Coletar arquivos estáticos
docker exec -it web python manage.py collectstatic
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build produção
npm run build

# Rodar testes
npm test
```

### Logs

```bash
# Todos os containers
docker compose logs -f

# Container específico
docker compose logs -f web
docker compose logs -f celery_worker
```

---

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Faça commits: `git commit -m 'Adiciona nova funcionalidade'`
3. Push: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

### Padrões de Código

- **Backend**: PEP8, Black formatter, isort
- **Frontend**: ESLint, Prettier

---

## 📄 Licença

Proprietário - Todos os direitos reservados © 2024-2025 B&F Laboratório de Metrologia

---

**Desenvolvido por Laisa Rioverde**  
Full Stack Developer

