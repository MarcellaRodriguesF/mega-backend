---
name: database-management
description: Analisa e modifica o modelo Prisma/PostgreSQL com foco em integridade, compatibilidade, migrations e preservação de dados.
---

# Database Management
Leia schema e migrations relevantes; identifique relações, cardinalidade, nulabilidade, defaults, índices e constraints.
Localize consumidores no backend e frontend.
Antes de alterar, avalie dados existentes, compatibilidade e estratégia de deploy.
Use Prisma Migrate e scripts existentes. Nunca altere banco diretamente.
Não apague, renomeie ou torne obrigatório campo sem estratégia para dados existentes.
Não execute migrations em produção, reset ou seed destrutivo sem autorização.
Explique impacto, migration, ordem de deploy e riscos.
