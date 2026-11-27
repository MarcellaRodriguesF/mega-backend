---
applyTo: "src/**/*.ts"
---
# Hub Mega Backend
- Stack conhecida: Node.js, Express, TypeScript, Prisma e PostgreSQL. Confirme versões e padrões reais.
- Siga a organização modular e as camadas já usadas no módulo.
- Inspecione módulos semelhantes antes de criar rotas, controllers, services ou schemas.
- Valide entradas com Zod conforme os padrões existentes.
- Valide autenticação, autorização e acesso ao recurso no servidor.
- Não confie em IDs ou escopos enviados pelo cliente sem validação.
- Preserve contratos de API e avalie consumidores frontend antes de alterá-los.
- Evite N+1 e carregue apenas relações necessárias.
- Use transações para operações que precisem ser atômicas.
- Não retorne dados sensíveis.
- Use Prisma Migrate conforme scripts do projeto; nunca altere banco diretamente.
- Avalie nulabilidade, defaults, relações, índices e dados existentes antes de migrations.
- Teste sucesso, validação, não autenticado, sem permissão e recurso inexistente.
