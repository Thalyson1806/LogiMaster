# LogiMaster

Sistema de gestão logística desenvolvido para controle de expedição, estoque, EDI, faturamento e rastreamento de entregas. Composto por uma API REST em .NET 8, um painel web em Next.js e um aplicativo mobile em React Native (Expo).

---

## Visão Geral

O LogiMaster centraliza os principais fluxos da operação logística:

- Criação e conferência de **romaneios** (packing lists) com geração de etiquetas
- Processamento de arquivos **EDIFACT** (DELFOR, DELJIT, RND) com vinculação de produtos por cliente
- Controle de **estoque** com endereçamento de warehouse por rua e localização
- Gestão de **solicitações de faturamento** e emissão de NF
- Visualização de **mapa de entregas** em tempo real
- Gestão de **usuários** com permissões granulares por módulo (bitmask)
- **Auditoria** de ações críticas no sistema
- App mobile para **conferência de romaneios**, **recebimento de MP** e **inventário**

---

## Estrutura do Repositório

```
src/
├── LogiMaster.API/              # ASP.NET Core 8 — REST API + SignalR
├── LogiMaster.Application/      # Casos de uso, DTOs, interfaces de serviço
├── LogiMaster.Domain/           # Entidades, enums, interfaces de repositório
├── LogiMaster.Infrastructure/   # EF Core, repositórios, migrações, serviços externos
├── logimaster-web/              # Next.js 15 — Painel web
└── logimaster-mobile/           # React Native + Expo — App mobile
```

### Arquitetura Backend (Clean Architecture)

```
API → Application → Domain ← Infrastructure
```

- **Domain**: entidades puras, regras de negócio, interfaces
- **Application**: serviços, DTOs, orquestração dos casos de uso
- **Infrastructure**: EF Core + PostgreSQL, repositórios, e-mail (MailKit), processamento EDIFACT, file watcher
- **API**: controllers, autorização por módulo (bitmask), hubs SignalR, middleware JWT

---

## Tecnologias

### Backend
| Tecnologia | Uso |
|---|---|
| .NET 8 / ASP.NET Core | API REST |
| Entity Framework Core | ORM + migrations |
| PostgreSQL | Banco de dados |
| SignalR | Atualizações em tempo real |
| JWT (System.IdentityModel.Tokens.Jwt) | Autenticação |
| BCrypt.Net | Hash de senhas |
| MailKit | Envio de e-mails |
| EPPlus | Exportação Excel |
| PdfPig | Leitura de PDFs de NF |

### Web
| Tecnologia | Uso |
|---|---|
| Next.js 15 (App Router) | Framework React |
| TypeScript | Tipagem estática |
| Tailwind CSS | Estilização |
| Leaflet | Mapa de entregas |
| JsBarcode | Geração de código de barras nas etiquetas |

### Mobile
| Tecnologia | Uso |
|---|---|
| React Native | Framework mobile |
| Expo | Toolchain e build |
| AsyncStorage | Persistência local |
| Expo Camera | Leitura de QR Code / barcode |

---

## Módulos e Funcionalidades

### Romaneios (Packing Lists)
- Criação manual ou automática via EDI
- Fluxo de status: `Pendente → Em Conferência → Concluído`
- Conferência item a item no app mobile com registro do conferente
- Geração de etiquetas com código de barras por item conferido
- Upload e vinculação de PDFs de nota fiscal
- Notificações em tempo real via SignalR ao mudar status

### EDI
- Importação automática de arquivos EDIFACT via pasta monitorada (file watcher)
- Suporte aos formatos DELFOR, DELJIT e RND
- Conversão para romaneios com vinculação por cliente/produto
- Tela de partes faltantes (missing parts) por cliente
- Histórico de arquivos importados

### Estoque
- Endereçamento físico por rua e localização (warehouse)
- Movimentações de entrada e saída
- Inventário via app mobile com leitura de código de barras

### Faturamento
- Solicitações de faturamento vinculadas a romaneios
- Controle de status de NF por item

### Mapa
- Visualização georreferenciada de entregas em andamento
- Integração com Leaflet

### Usuários e Permissões
- Roles: `Administrator`, `Shipping`, `LogisticsAnalyst`, `Invoicing`, `Driver`, `Viewer`
- Permissões granulares por módulo usando bitmask (`AppModule` enum `[Flags]`)
- Cada módulo possui bits independentes para Visualizar, Criar, Editar e Excluir
- Administrator tem acesso irrestrito; demais usuários seguem o bitmask configurado

### Auditoria
- Log automático de ações críticas com usuário, data/hora e dados alterados

---

## Sistema de Permissões

As permissões são armazenadas como um inteiro (`long`) no banco e incluídas no JWT como claim numérica. O frontend decodifica o payload do JWT com `atob` para checar bits sem depender da serialização da API.

```
Bit 0-3   → Romaneios  (View | Create | Edit | Delete)
Bit 4-7   → EDI
Bit 8-11  → Faturamento
Bit 12-15 → Clientes
Bit 16-19 → Produtos/Embalagens
Bit 20-23 → Estoque/Warehouse
Bit 24    → Mapa
Bit 28    → Email
```

---

## Configuração e Execução

### Pré-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 14+](https://www.postgresql.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (para o app mobile)

### 1. Backend

```bash
cd LogiMaster.API
```

Configure o `appsettings.json` (ou variáveis de ambiente):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=logimaster;Username=postgres;Password=sua_senha"
  },
  "Jwt": {
    "Secret": "SuaChaveSecretaAqui",
    "Issuer": "LogiMaster",
    "Audience": "LogiMaster"
  },
  "EmailSettings": {
    "SmtpHost": "smtp.seuservidor.com",
    "SmtpPort": 587,
    "Username": "seu@email.com",
    "Password": "sua_senha"
  }
}
```

Execute:

```bash
dotnet run
# API disponível em http://localhost:5000
# Swagger em http://localhost:5000/swagger
```

As migrações são aplicadas automaticamente no ambiente de desenvolvimento.

### 2. Web

```bash
cd logimaster-web
npm install
```

Configure a URL da API em `src/lib/api.ts`:

```ts
const API_BASE = "http://localhost:5000/api";
```

Execute:

```bash
npm run dev
# Disponível em http://localhost:3000
```

### 3. Mobile

```bash
cd logimaster-mobile
npm install
```

Configure a URL da API em `src/services/api.ts`:

```ts
export const BASE_URL = "http://SEU_IP_LOCAL:5000";
```

Execute:

```bash
npx expo start
```

Escaneie o QR Code com o app **Expo Go** (Android/iOS) ou rode em emulador.

---

## Estrutura de Telas

### Web (`/logistica`)
| Rota | Módulo |
|---|---|
| `/logistica` | Dashboard |
| `/logistica/packing-lists` | Romaneios |
| `/logistica/expedicao` | Expedição |
| `/logistica/expedicao/etiquetas` | Etiquetas |
| `/logistica/edi` | EDI |
| `/logistica/edi/import` | Importação EDIFACT |
| `/logistica/edi/vinculos` | Vínculos cliente/produto |
| `/logistica/edi/history` | Histórico |
| `/logistica/edi/missing-parts` | Partes faltantes |
| `/logistica/estoque` | Estoque |
| `/logistica/warehouse` | Endereçamento |
| `/logistica/map` | Mapa |
| `/logistica/faturamento` | Faturamento |
| `/logistica/billing-requests` | Solicitações de faturamento |
| `/logistica/usuarios` | Usuários e permissões |
| `/logistica/auditoria` | Auditoria |

### Mobile
| Tela | Descrição |
|---|---|
| Login | Autenticação |
| Home (Romaneios) | Lista de romaneios pendentes |
| Conference | Conferência item a item |
| DeliveryList | Entregas do motorista |
| Recebimento | Recebimento de matéria-prima |
| Inventory | Inventário de estoque |
| Scanner | Leitura de código de barras |
| Signature | Assinatura digital de entrega |

---

## Variáveis de Ambiente Relevantes

| Variável | Descrição |
|---|---|
| `ConnectionStrings__DefaultConnection` | String de conexão PostgreSQL |
| `Jwt__Secret` | Chave secreta para assinatura do JWT |
| `Jwt__Issuer` | Issuer do JWT |
| `Jwt__Audience` | Audience do JWT |
| `EmailSettings__SmtpHost` | Host SMTP para envio de e-mails |
| `EdiFileWatcher__Path` | Pasta monitorada para importação automática de EDI |

---

