# MEGA Platform — Technical

## Stack

### Frontend
- Next.js
- TypeScript
- TanStack Query
- React Hook Form
- Zod
- CSS Modules

### Backend
- Node.js
- TypeScript
- Express
- Prisma
- Zod

### Database
- PostgreSQL
- Prisma Migrate

### Authentication
- JWT
- bcrypt

---

## Architecture

Frontend e backend são aplicações independentes.

```text
Frontend
   ↓ HTTP/HTTPS
Backend API
   ↓
Services
   ↓
Prisma
   ↓
PostgreSQL

O backend não deve depender do frontend para executar regras de negócio.
Backend structure
src/
├── server.ts
├── app.ts
├── config/
├── core/
├── database/
├── generated/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── clients/
│   ├── providers/
│   ├── units/
│   ├── implementations/
│   ├── activities/
│   ├── tickets/
│   ├── daily-reports/
│   ├── monitoring/
│   ├── dashboard/
│   └── reports/
└── workers/

Backend pattern
O padrão principal é:
Routes
  ↓
Controllers
  ↓
Services
  ↓
Prisma

Routes
Definem os endpoints e middlewares.
Controllers
Recebem a requisição e chamam os services.
Services
Contêm as regras de negócio.
Prisma
Responsável pelo acesso ao PostgreSQL.
Não criar Repository sem necessidade real.
API
A API utiliza REST.
Prefixo:
/api/v1

Os dados são enviados em JSON.
As entradas da API devem ser validadas com Zod.
Database
Banco:
PostgreSQL

ORM:
Prisma

As alterações do banco devem ser feitas através de migrations.
As entidades utilizam UUID como identificador principal.
Padrão:
id String @id @default(uuid()) @db.Uuid

TypeScript utiliza camelCase.
Banco utiliza snake_case.
Exemplo:
accessProfileId String @map("access_profile_id")

Authentication
A autenticação utiliza:
- JWT
- bcrypt
Senhas nunca são armazenadas em texto puro.
Autenticação e autorização são responsabilidades do backend.
Files
Os arquivos serão armazenados inicialmente no servidor da MEGA.
O banco armazena os metadados e referências dos arquivos.
AWS S3 não faz parte da implementação atual.
Monitoring
O MVP de monitoramento utiliza ICMP/PING.
Estados:
ONLINE
OFFLINE
NÃO VERIFICADO

O monitoramento será executado por um worker separado da API.
Integração com Zabbix fica para uma evolução futura.
Development rules
- Não inventar regras de negócio.
- Consultar BUSINESS-RULES.md antes de implementar uma regra.
- Regras ainda não confirmadas devem permanecer como 🟡 EM VALIDAÇÃO.
- Não criar funcionalidades futuras sem necessidade definida.
- Não criar tabelas ou relacionamentos apenas por antecipação.
- Manter o código simples e modular.
- Alterações no banco devem utilizar migrations.
- Não versionar secrets ou credenciais.