# LogiMaster API

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat-square&logo=dotnet)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql)
![EF Core](https://img.shields.io/badge/EF%20Core-8-512BD4?style=flat-square&logo=dotnet)

API REST do sistema LogiMaster. Responsável por toda a lógica de negócio: gestão de romaneios, expedição, faturamento, EDI, armazém, mapa e usuários.

---

## Stack

- .NET 8 / ASP.NET Core Web API
- Entity Framework Core 8 + Npgsql (PostgreSQL)
- JWT Bearer Authentication
- SignalR (rastreamento em tempo real)
- iText7 (geração de PDF — romaneios e canhotos)
- EPPlus (leitura de planilhas Excel)
- Swagger / OpenAPI (disponível em `/swagger`)

Arquitetura Clean Architecture dividida em quatro projetos:

```
LogiMaster.Domain/         # Entidades, enums, interfaces de repositório
LogiMaster.Application/    # Serviços, DTOs, interfaces de serviço
LogiMaster.Infrastructure/ # EF Core, repositórios, parsers EDI, e-mail
LogiMaster.API/            # Controllers, hubs SignalR, middleware JWT
```

---

## Configuração

### Connection String

Edite `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=logimaster;Username=postgres;Password=sua_senha"
  }
}
```

### JWT

```json
{
  "Jwt": {
    "Secret": "SuaChaveSecretaComPeloMenos32Caracteres",
    "Issuer": "LogiMaster",
    "Audience": "LogiMaster"
  }
}
```

### EDI File Watcher

```json
{
  "EdiFileWatcher": {
    "Enabled": true,
    "WatchFolder": "C:\\EDI\\Entrada",
    "ProcessedFolder": "C:\\EDI\\Processados",
    "ErrorFolder": "C:\\EDI\\Erros",
    "PollingIntervalSeconds": 30
  }
}
```

### E-mail (opcional)

```json
{
  "EmailSettings": {
    "SmtpHost": "smtp.seuservidor.com",
    "SmtpPort": 587,
    "SmtpUser": "email@suaempresa.com",
    "SmtpPassword": "sua_senha",
    "Pop3Host": "pop3.seuservidor.com",
    "Pop3Port": 995,
    "Pop3User": "email@suaempresa.com",
    "Pop3Password": "sua_senha"
  }
}
```

---

## Como rodar

```bash
cd LogiMaster.API
dotnet run
```

Em modo Development, as migrations do EF Core são aplicadas automaticamente na inicialização. O seed de dados EDI também é executado automaticamente.

- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/swagger`

---

## Migrations

Para criar e aplicar migrations manualmente:

```bash
# Criar migration
dotnet ef migrations add NomeDaMigration --project ../LogiMaster.Infrastructure --startup-project .

# Aplicar ao banco
dotnet ef database update --project ../LogiMaster.Infrastructure --startup-project .
```

---

## Principais Endpoints

### Autenticação — `/api/auth`
- `POST /login` — login com e-mail e senha, retorna JWT
- `GET /me` — dados do usuário autenticado

### Romaneios — `/api/packinglists`
- `GET /` — lista todos os romaneios
- `GET /{id}` — detalhes de um romaneio
- `GET /status/{status}` — filtra por status
- `GET /dashboard` — KPIs para o dashboard
- `GET /pending-labels` — itens pendentes de impressão de etiqueta por usuário
- `GET /for-delivery` — romaneios disponíveis para o motorista
- `GET /active-drivers` — motoristas em rota (via SignalR hub)
- `POST /` — criar romaneio
- `POST /{id}/start-separation` — iniciar separação
- `POST /{id}/complete-separation` — concluir separação
- `POST /{id}/start-conference` — iniciar conferência (vincula ao usuário logado)
- `POST /{id}/conference-item` — conferir item individual
- `POST /{id}/complete-conference` — concluir conferência
- `POST /{id}/invoice` — faturar romaneio
- `POST /{id}/dispatch` — despachar (motorista saiu)
- `POST /{id}/deliver` — marcar como entregue
- `POST /{id}/cancel` — cancelar
- `POST /{id}/invoice-pdf` — fazer upload de NF em PDF
- `GET /{id}/invoice-pdf` — baixar NF PDF
- `GET /{id}/canhoto` — baixar canhoto
- `POST /{id}/generate-canhoto` — gerar canhoto com assinatura
- `POST /{id}/location` — atualizar localização GPS do motorista

### Clientes — `/api/customers`
- `GET /` — lista todos
- `GET /{id}`, `GET /code/{code}`, `GET /search`
- `POST /` — criar
- `PUT /{id}` — atualizar
- `DELETE /{id}` — excluir
- `POST /{id}/activate` — reativar

### Produtos — `/api/products`
- `GET /`, `GET /{id}`, `GET /reference/{ref}`, `GET /search`
- `POST /` — criar
- `PUT /{id}`, `DELETE /{id}`, `POST /{id}/activate`
- `POST /import-packaging` — importar embalagens via Excel
- `POST /import-catalog` — importar catálogo
- `POST /import-master` — importar master de produtos
- `POST /import-spreadsheet` — importar planilha genérica

### Embalagens — `/api/packagings`
- `GET /`, `GET /{id}`, `GET /code/{code}`, `GET /type/{typeId}`, `GET /search`
- `GET /types`, `POST /types`
- `POST /`, `PUT /{id}`
- `POST /{id}/activate`, `POST /{id}/deactivate`
- `POST /import-spreadsheet`

### Faturamento — `/api/billingrequests`
- `GET /` — lista solicitações
- `GET /pending-summary` — resumo de pendências por cliente
- `GET /pending-items/{customerId}` — itens pendentes de um cliente
- `POST /import` — importar solicitações
- `POST /import-with-confirmation` — importar com validação prévia
- `POST /pre-validate` — pré-validar antes de importar
- `DELETE /{id}`

### EDI — `/api/edifact`, `/api/ediclients`, `/api/ediconversions`
- `GET /edifact/files` — lista arquivos EDI processados
- `POST /edifact/upload` — upload manual de arquivo EDIFACT
- `POST /edifact/files/{id}/process` — reprocessar arquivo
- `POST /edifact/detect-customer` — detectar cliente no arquivo
- `GET /ediclients/` — clientes EDI cadastrados
- `POST /ediclients/` — cadastrar cliente EDI
- `POST /ediconversions/convert` — converter EDIFACT em romaneio
- `GET /ediconversions/{id}/download` — baixar conversão

### Mapa — `/api/map`
- `GET /customers` — clientes com coordenadas
- `GET /deliveries` — entregas em andamento
- `POST /geocode/{customerId}` — geocodificar endereço de um cliente
- `POST /geocode-all` — geocodificar todos sem coordenadas

### Armazém — `/api/warehouse`
- `GET /streets`, `POST /streets`, `PUT /streets/{id}`, `DELETE /streets/{id}`
- `GET /locations`, `POST /locations`, `POST /locations/bulk`, `DELETE /locations/{id}`
- `GET /product-locations`, `POST /product-locations`, `DELETE /product-locations/{id}`
- `GET /map` — mapa visual do armazém

### Estoque — `/api/stock`
- `GET /` — posição atual do estoque
- `GET /{productId}/movements` — movimentações de um produto
- `POST /movement` — registrar movimentação
- `DELETE /movement/{id}`
- `POST /bulk` — lançamento em massa

### Usuários — `/api/users`
- `GET /` — lista usuários
- `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`
- `PUT /{id}/permissions` — atualizar permissões (bitmask por módulo)
- `PUT /{id}/password` — alterar senha
- `POST /{id}/activate` — reativar usuário

### Auditoria — `/api/audit`
- `GET /` — log de auditoria com filtros

### E-mail — `/api/email`
- `POST /send`, `POST /send-with-attachment`
- `GET /inbox`, `GET /inbox/edi`

---

## Sistema de Permissões

Cada usuário tem um campo `permissions` (inteiro, bitmask) que define acesso por módulo:

| Módulo      | View     | Create   | Edit     | Delete   |
|-------------|----------|----------|----------|----------|
| Romaneios   | bit 0    | bit 1    | bit 2    | bit 3    |
| EDI         | bit 4    | bit 5    | bit 6    | bit 7    |
| Faturamento | bit 8    | bit 9    | bit 10   | bit 11   |
| Clientes    | bit 12   | bit 13   | bit 14   | bit 15   |
| Produtos    | bit 16   | bit 17   | bit 18   | bit 19   |
| Estoque     | bit 20   | bit 21   | —        | bit 22   |
| Mapa        | bit 24   | —        | —        | —        |
| E-mail      | bit 28   | —        | —        | —        |

O role `Administrator` ignora o bitmask e tem acesso total.
