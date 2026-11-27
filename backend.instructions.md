# Hub Mega — instruções gerais do Copilot

- Trabalhe na branch `develop`; nunca altere `main` nem troque branches sem pedido explícito.
- Antes de editar, confira `git status` e preserve alterações locais.
- Leia a documentação pertinente (`docs/PROJECT-CONTEXT.md`, `docs/BUSINESS-RULES.md`, `docs/TECHNICAL.md`, quando existirem).
- Inspecione a implementação e procure componentes, serviços, hooks, schemas, rotas e testes semelhantes antes de criar algo.
- Não invente regras de negócio. Sinalize lacunas, contradições e decisões que dependem da Mega.
- Diferencie fatos confirmados, inferências técnicas, hipóteses e sugestões.
- Faça a menor alteração coerente com o escopo; evite refatorações não solicitadas.
- Reutilize dependências existentes; não instale bibliotecas sem justificar e pedir autorização.
- Não faça commits, pushes, deploys, migrations destrutivas ou mudanças de infraestrutura sem pedido explícito.
- Autorização deve ser validada no backend; esconder botões no frontend não protege operações.
- Preserve dados sensíveis; nunca exponha senhas, hashes, tokens ou segredos.
- Trate estados de loading, erro, vazio, sucesso e acesso negado.
- Ao concluir, informe resumo, arquivos alterados, testes executados, limitações e pendências.
