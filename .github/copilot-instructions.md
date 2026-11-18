# Instruções do GitHub Copilot — MEGA Platform

## Contexto

Antes de implementar qualquer funcionalidade, consulte:

- `docs/PROJECT-CONTEXT.md`
- `docs/BUSINESS-RULES.md`
- `docs/TECHNICAL.md`

Esses arquivos são as principais referências do projeto.

---

## Regras de negócio

Não invente regras de negócio.

Quando um requisito não estiver claramente definido em `BUSINESS-RULES.md`, considere-o:

`🟡 EM VALIDAÇÃO`

Não transforme uma hipótese em uma regra definitiva de banco ou aplicação.

Quando uma nova decisão alterar o funcionamento do negócio, atualize a documentação correspondente.

---

## Padrões técnicos

Utilize a stack definida no projeto:

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Zod
- JWT
- bcrypt

Siga a arquitetura:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Prisma
  ↓
PostgreSQL

Mantenha os Controllers simples e concentre as regras de negócio nos Services.
Não crie abstrações ou camadas desnecessárias.
Banco de dados
- Utilize Prisma para acesso ao banco.
- Utilize Prisma Migrate para alterações estruturais.
- Utilize UUID como identificador principal.
- Utilize camelCase no TypeScript.
- Utilize snake_case no banco de dados.
- Não crie relacionamentos sem uma justificativa de negócio definida.
Segurança
- Nunca armazene senhas em texto puro.
- Nunca exponha secrets ou credenciais.
- Nunca adicione credenciais reais ao repositório.
- Valide entradas da API com Zod.
- A autorização deve ser aplicada no backend.
- Não exponha informações sensíveis em logs ou respostas desnecessariamente.
Processo de desenvolvimento
Antes de implementar:
1. Entenda o requisito.
2. Consulte a documentação do projeto.
3. Verifique se a regra está definida ou ainda está em validação.
4. Implemente a solução mais simples adequada.
5. Não implemente funcionalidades futuras sem uma necessidade definida.
6. Mantenha código e documentação consistentes.
Ao alterar o banco:
1. Atualize o schema.prisma.
2. Crie uma migration.
3. Verifique a migration.
4. Atualize a documentação caso a alteração afete uma regra ou decisão do projeto.
Princípios
Priorize:
- Código simples.
- Clareza.
- Segurança.
- Baixo acoplamento.
- Manutenibilidade.
- Consistência com a documentação.
- Evolução incremental.
Não implemente uma regra apenas porque ela parece tecnicamente conveniente.
A operação real da MEGA deve orientar as decisões de negócio.

Esse arquivo já é **suficiente para o Copilot**. Não precisamos transformar ele em um manual enorme.

Agora nossa estrutura está fechada:

```text
mega-backend/
│
├── .github/
│   └── copilot-instructions.md
│
├── docs/
│   ├── PROJECT-CONTEXT.md
│   ├── BUSINESS-RULES.md
│   └── TECHNICAL.md
│
├── prisma/
├── src/
├── .env
├── .env.example
├── prisma.config.ts
└── package.json