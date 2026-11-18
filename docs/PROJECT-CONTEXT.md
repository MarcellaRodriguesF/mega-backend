# MEGA Platform — Project Context

## 1. Sobre o projeto

A MEGA Platform é uma plataforma web desenvolvida para centralizar, organizar e acompanhar os processos operacionais da MEGA.

O sistema tem como objetivo substituir a dispersão de informações entre diferentes ferramentas, planilhas, documentos e canais de comunicação, proporcionando uma visão centralizada das operações.

A plataforma deverá permitir o cadastro e acompanhamento de clientes, unidades, provedores, implantações, atividades, chamados, documentos, evidências e indicadores operacionais.

---

## 2. Objetivo do sistema

Os principais objetivos da plataforma são:

- Centralizar informações operacionais.
- Organizar processos e atividades.
- Acompanhar a execução das atividades.
- Registrar evidências das atividades realizadas.
- Manter histórico das operações.
- Centralizar informações de clientes, unidades e provedores.
- Registrar e acompanhar chamados.
- Disponibilizar indicadores operacionais.
- Facilitar a geração de relatórios.
- Aumentar a rastreabilidade das operações.
- Reduzir a dependência de informações espalhadas em diferentes canais.

O sistema deve priorizar organização, rastreabilidade, clareza das informações e facilidade de acompanhamento da operação.

---

## 3. Contexto da operação

A operação da MEGA envolve diferentes tipos de profissionais, atividades e processos.

Entre os principais elementos identificados estão:

- Clientes.
- Usinas e outras unidades.
- Provedores.
- Implantações.
- Etapas.
- Atividades.
- Equipes.
- Profissionais.
- Chamados.
- Registros diários de execução.
- Documentos.
- Evidências.
- Informações técnicas.
- Indicadores e relatórios.

A estrutura definitiva dessas entidades e seus relacionamentos ainda está sendo validada com a MEGA.

Nenhuma regra de negócio deve ser considerada definitiva apenas por ter sido identificada durante o levantamento inicial.

---

## 4. Conceitos importantes

### 4.1 Cliente

Representa a empresa ou organização atendida pela MEGA.

Um cliente pode possuir uma ou mais unidades/usinas e pode estar relacionado a diferentes implantações e atividades.

---

### 4.2 Unidade / Usina

Representa uma unidade física ou usina relacionada à operação da MEGA.

As unidades podem possuir informações cadastrais, localização, dados técnicos, conectividade, serviços instalados, documentos e histórico.

A localização pode ser representada principalmente por coordenadas geográficas.

Nem toda implantação necessariamente está relacionada a uma unidade.

---

### 4.3 Implantação

Representa um trabalho, projeto ou processo operacional realizado pela MEGA.

Uma implantação pode estar relacionada a um cliente e, quando aplicável, a uma unidade/usina.

Uma implantação pode existir sem uma unidade física associada.

Dentro de uma implantação podem existir etapas e atividades.

A estrutura definitiva e as regras de uma implantação ainda estão em validação.

---

### 4.4 Etapa

Representa um agrupamento ou fase dentro de uma implantação.

Exemplo:

```text
Implantação: Sistema CFTV

Etapa:
Instalação do sistema CFTV

4.5 Atividade
Representa uma tarefa ou trabalho que precisa ser executado.
Uma atividade pode estar relacionada a uma implantação, mas também pode existir de forma independente.
Exemplos:
- Instalar câmera.
- Instalar cabeamento.
- Configurar NVR.
- Realizar certificação.
- Realizar manutenção.
- Levantar materiais.
- Executar uma tarefa administrativa.
As atividades podem possuir responsáveis, equipes, status, datas, quantidades, evolução, comentários e evidências.
4.6 Registro Diário de Obra / Execução
O registro diário representa o que efetivamente aconteceu durante determinado dia de execução.
Ele não representa uma nova etapa do processo.
Um registro diário pode registrar:
- Data.
- Implantação.
- Profissionais envolvidos.
- Funções.
- Atividades executadas.
- Quantidade prevista.
- Quantidade realizada.
- Evolução.
- Comentários.
- Condições climáticas.
- Evidências.
- Status de aprovação.
Uma mesma atividade pode ser executada parcialmente em diferentes registros diários.
4.7 Chamado
Representa um problema, solicitação ou ocorrência que precisa ser acompanhada pela MEGA.
Atualmente foram identificados principalmente chamados relacionados à conectividade, como indisponibilidade de internet.
Exemplos de possíveis causas:
- Rompimento de fibra.
- Falha de energia.
- Problema no link.
- Problema interno na unidade.
A utilização de chamados para outros tipos de ocorrências, como CFTV, equipamentos, infraestrutura ou manutenção, ainda deve ser validada.
4.8 Profissional
Representa uma pessoa que participa da operação da MEGA.
Um profissional possui uma função operacional, como:
- Engenheiro.
- Líder Técnico.
- Técnico.
- Analista.
- Gerente.
Um profissional não necessariamente precisa possuir acesso ao sistema.
4.9 Usuário
Representa uma conta utilizada para acessar a plataforma.
Um usuário possui credenciais de autenticação e um perfil de acesso.
Um profissional e um usuário são conceitos diferentes.
Um profissional pode existir no sistema sem necessariamente possuir uma conta de acesso.
4.10 Função
Representa a função que um profissional exerce na operação.
Exemplos:
- Engenheiro.
- Líder Técnico.
- Técnico.
- Analista.
- Gerente.
A função profissional não determina necessariamente as permissões técnicas de acesso ao sistema.
4.11 Perfil de acesso
Representa o conjunto de permissões que determina o que um usuário pode fazer dentro da plataforma.
Exemplos inicialmente considerados:
- Administrador.
- Engenheiro.
- Executor.
Esses perfis são uma estrutura inicial e ainda podem ser alterados após a validação com a MEGA.
5. Estrutura conceitual atual
A estrutura conceitual atualmente considerada é:
CLIENTE
   │
   ├── UNIDADE / USINA
   │
   └── IMPLANTAÇÃO
          │
          ├── ETAPAS
          │      │
          │      └── ATIVIDADES
          │
          └── REGISTROS DIÁRIOS

Porém, algumas entidades possuem utilização independente.
Por exemplo:
ATIVIDADE
   ├── pode pertencer a uma IMPLANTAÇÃO
   ├── pode estar relacionada a um CHAMADO
   └── pode existir de forma independente

Portanto, esse diagrama representa uma visão conceitual inicial e não deve ser interpretado como modelo definitivo de banco de dados.
6. Módulos planejados
A plataforma está sendo planejada em módulos.
01 — Fundação
Responsável pela base técnica do sistema:
- Autenticação.
- Usuários.
- Perfis de acesso.
- Permissões.
- Estrutura inicial do sistema.
- Layout e navegação.
- Banco de dados.
02 — Clientes
Responsável pelo cadastro e gerenciamento de clientes.
03 — Provedores
Responsável pelo cadastro e gerenciamento de provedores, contatos e canais de atendimento.
04 — Usinas / Unidades
Responsável pelo cadastro e acompanhamento das unidades e suas informações técnicas.
05 — Implantações
Responsável pelo planejamento e acompanhamento das implantações.
06 — Chamados
Responsável pelo registro e acompanhamento de chamados e ocorrências.
07 — Dashboard
Responsável pela visualização de indicadores gerais da operação.
08 — Relatórios
Responsável pela geração e visualização de relatórios operacionais.
09 — Responsividade
Garantia de utilização da plataforma em:
- Desktop.
- Tablet.
- Mobile.
10 — Evoluções
Possíveis funcionalidades futuras:
- Mapas.
- Automações.
- Alertas.
- Integrações.
- Integração com ferramentas de monitoramento.
- Outras funcionalidades identificadas durante a evolução do sistema.
7. Arquitetura técnica
A plataforma será composta por aplicações independentes de frontend e backend.
Frontend
Tecnologias principais:
- Next.js.
- TypeScript.
- TanStack Query.
- React Hook Form.
- Zod.
- CSS Modules.
Backend
Tecnologias principais:
- Node.js.
- TypeScript.
- Express.
- Prisma.
- Zod.
Banco de dados
- PostgreSQL.
- Prisma ORM.
- Prisma Migrate.
Autenticação
- JWT.
- bcrypt.
Comunicação
Frontend e backend se comunicam através de uma API REST.
Estrutura inicial:
Frontend
   │
   │ HTTP/HTTPS
   ▼
Backend API
   │
   ▼
Services
   │
   ▼
Prisma
   │
   ▼
PostgreSQL

8. Organização do backend
O backend será organizado de forma modular.
Estrutura prevista:
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

A estrutura poderá evoluir conforme novos requisitos forem identificados.
9. Status das decisões do projeto
Para evitar que hipóteses sejam tratadas como regras definitivas, a documentação utiliza os seguintes status:
🟢 DEFINIDO
Decisão ou regra já definida para o projeto.
🟡 EM VALIDAÇÃO
Hipótese ou regra identificada durante o levantamento que ainda precisa ser confirmada com a MEGA.
🔵 FUTURO
Funcionalidade ou evolução planejada para uma etapa posterior.
⚪ FORA DO ESCOPO
Item que não faz parte da versão ou escopo atual.
10. O que já está definido
Atualmente estão definidos os seguintes pontos técnicos:
- Frontend e backend serão aplicações independentes.
- Backend utilizando Node.js + TypeScript.
- Backend utilizando Express.
- PostgreSQL como banco de dados.
- Prisma como ORM.
- Prisma Migrate para migrations.
- Identificadores utilizando UUID.
- API REST versionada.
- Autenticação utilizando JWT.
- Senhas armazenadas utilizando hash com bcrypt.
- Backend modular.
- Regras de negócio devem ficar fora dos controllers.
- Banco de dados deve evoluir através de migrations.
- Documentação técnica fará parte do projeto.
- O sistema deverá ser desenvolvido de forma incremental.
11. Pontos ainda em validação
Os seguintes pontos ainda precisam ser confirmados com a MEGA:
- Estrutura definitiva das entidades.
- Relacionamentos e cardinalidades.
- Campos obrigatórios de cada entidade.
- Regras de implantação.
- Estrutura definitiva de etapas e atividades.
- Regras de execução das atividades.
- Funcionamento dos registros diários.
- Regras de equipes.
- Permissões definitivas de cada perfil.
- Utilização de chamados para além de conectividade.
- Regras de documentos e evidências.
- Fluxo de aprovação.
- Regras de conclusão de atividades.
- Necessidade de assinatura digital.
- Necessidade de controle de ativos/equipamentos.
- Regras de monitoramento.
- Indicadores definitivos do dashboard.
Esses pontos não devem ser implementados como regras definitivas sem validação.
12. Evoluções futuras
Funcionalidades identificadas como possíveis evoluções:
- Mapas das unidades.
- Automações.
- Alertas e notificações.
- Integrações com outros sistemas.
- Integração com Zabbix.
- Monitoramento avançado.
- Histórico de disponibilidade.
- Indicadores adicionais.
- Outras funcionalidades identificadas durante a utilização da plataforma.
13. Princípio de desenvolvimento
A plataforma deve ser construída de forma incremental.
Antes de transformar uma hipótese operacional em uma regra técnica ou estrutura definitiva de banco de dados, a regra deve ser validada com a MEGA.
Quando uma informação ainda não estiver definida, ela deve ser identificada explicitamente como:
- 🟡 EM VALIDAÇÃO
O código não deve criar regras de negócio apenas porque uma determinada estrutura parece tecnicamente conveniente.
As decisões técnicas devem considerar:
- Clareza.
- Simplicidade.
- Segurança.
- Baixo acoplamento.
- Facilidade de manutenção.
- Evolução futura.
- Compatibilidade com as regras reais da operação.
14. Fonte da verdade
Este documento apresenta o contexto geral do projeto.
Detalhes específicos devem ser consultados nos documentos correspondentes:
- docs/architecture.md — arquitetura técnica.
- docs/business-rules.md — regras de negócio.
- docs/database.md — banco de dados.
- docs/authentication.md — autenticação e autorização.
- docs/decisions.md — decisões técnicas e de produto.
- .github/copilot-instructions.md — instruções para desenvolvimento com GitHub Copilot.
Quando houver conflito entre uma hipótese antiga e uma decisão posteriormente validada, a documentação mais recente e específica deve prevalecer.
15. Regra para futuras alterações
Sempre que uma decisão relevante alterar o funcionamento do sistema:
1. A regra de negócio deve ser registrada ou atualizada.
2. A decisão técnica deve ser documentada quando necessário.
3. O código deve refletir a decisão validada.
4. A documentação deve permanecer alinhada ao código.
A documentação deve evoluir junto com o projeto.

### O papel desse arquivo

Pense no `PROJECT-CONTEXT.md` como a **capa técnica do projeto**.

Se amanhã entrar outra pessoa no projeto e ela perguntar:

> “O que é esse sistema MEGA, para que serve, quais são os módulos e qual tecnologia vocês estão usando?”

é **esse arquivo** que ela deve ler primeiro.

Ele **não deve** explicar, por exemplo, como funciona exatamente o JWT, como criar uma migration Prisma ou qual é a regra detalhada de aprovação de um RDO. Isso ficará nos próximos arquivos.

E tem uma coisa importante: eu mantive deliberadamente alguns pontos como **🟡 EM VALIDAÇÃO**, porque já identificamos várias hipóteses de negócio que ainda serão confirmadas com a MEGA. Isso evita que o Copilot futuramente trate uma hipótese nossa como uma regra oficial.

**Depois desse, o próximo arquivo será `architecture.md`**, que vai responder especificamente: **“Como esse sistema é construído tecnicamente?"**