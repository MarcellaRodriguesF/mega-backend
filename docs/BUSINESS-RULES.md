# MEGA Platform — Regras de Negócio

Este documento registra as principais regras de negócio identificadas na operação da MEGA.

Quando uma regra ainda não estiver confirmada, ela deve ser marcada como:

`🟡 EM VALIDAÇÃO`

---

## Cliente

- Cliente representa a empresa ou organização atendida pela MEGA.
- Um cliente pode possuir unidades e implantações.
- Campos e regras definitivas ainda estão em validação.

---

## Unidade / Usina

- Representa uma unidade física relacionada à operação.
- Pode possuir localização, coordenadas, dados técnicos, conectividade, serviços, documentos e histórico.
- Coordenadas são importantes para identificar a localização da unidade.
- Nem toda implantação precisa estar vinculada a uma unidade.

🟡 Tipos e campos obrigatórios ainda estão em validação.

---

## Implantação

- Representa um trabalho, projeto ou processo realizado pela MEGA.
- Pode estar relacionada a um cliente.
- Pode estar relacionada a uma unidade, mas isso não é obrigatório.
- Pode possuir etapas e atividades.
- Pode possuir responsável, equipe, documentos, evidências e histórico.

🟡 Tipos, campos obrigatórios e regras de conclusão ainda estão em validação.

---

## Etapa

- Representa um agrupamento ou fase dentro de uma implantação.
- Uma etapa pode possuir várias atividades.

Exemplo:

````text
Implantação
└── Instalação do sistema CFTV
    ├── Instalar câmeras
    ├── Instalar cabeamento
    └── Configurar NVR

    🟡 A nomenclatura e estrutura definitiva ainda estão em validação.
Atividade
- Representa uma tarefa ou trabalho a ser executado.
- Pode estar relacionada a uma implantação.
- Pode existir sem implantação.
- Pode possuir responsável, equipe, status, datas, quantidade, evolução, comentários e evidências.
- Uma atividade pode ser executada parcialmente.
- Uma mesma atividade pode aparecer em diferentes registros de execução.
🟡 Status, permissões e requisitos para conclusão ainda estão em validação.
Execução / RDO
- O RDO representa o que foi executado em determinado dia.
- RDO não é uma etapa da implantação.
- Uma atividade pode ser registrada em vários RDOs.
- A execução pode registrar quantidade realizada, evolução, profissionais, comentários e evidências.
🟡 Fluxo de criação, preenchimento, envio e aprovação ainda está em validação.
Chamados
- Chamado representa um problema, solicitação ou ocorrência.
- Atualmente foram identificados principalmente chamados relacionados à conectividade.
- Um chamado pode estar relacionado a cliente, unidade, provedor e responsável.
- Um chamado possui histórico de evolução.
🟡 Ainda precisa ser validado se chamados também serão utilizados para CFTV, equipamentos, manutenção e outras ocorrências.
Chamado x Atividade
🟡 Regra em validação:
Chamado
   ↓
Atividade(s) de resolução

Um chamado pode gerar uma ou mais atividades, mas ainda precisa ser confirmado se todo chamado obrigatoriamente terá uma atividade.
Profissional
- Representa uma pessoa que participa da operação.
- Pode possuir uma função, como Engenheiro, Técnico, Analista ou Líder Técnico.
- Um profissional não precisa necessariamente possuir acesso ao sistema.
Usuário
- Representa uma conta de acesso à plataforma.
- Possui credenciais e um perfil de acesso.
- Usuário e profissional são conceitos diferentes.
Função x Perfil de acesso
Função representa o papel operacional:
Engenheiro
Técnico
Analista
Líder Técnico
Gerente

Perfil de acesso representa as permissões no sistema:
Administrador
Engenheiro
Executor

Esses conceitos não devem ser tratados como equivalentes.
🟡 Perfis e permissões definitivos ainda estão em validação.
Equipes
🟡 Em validação:
- Como as equipes são formadas.
- Se são fixas ou montadas por implantação.
- Se um profissional pode pertencer a várias equipes.
- Como engenheiros se relacionam com as equipes.
- Se a equipe é vinculada à implantação ou à atividade.
Documentos x Evidências
Documento → arquivo utilizado como referência ou documentação formal.
Evidência → arquivo utilizado para comprovar uma execução ou ocorrência.
Exemplos de evidências:
- Fotos.
- Certificados.
- Registros de testes.
- Prints.
Requisitos para conclusão
🟡 Em validação:
Uma atividade poderá possuir requisitos específicos para ser concluída.
Exemplos:
Evidência obrigatória
Quantidade obrigatória
Comentário obrigatório
Aprovação obrigatória

Os requisitos podem variar de acordo com a atividade.
Histórico
A plataforma deve manter rastreabilidade das operações.
Podem fazer parte do histórico:
- Alterações de status.
- Alterações de responsáveis.
- Execuções.
- Comentários.
- Aprovações.
- Alterações relevantes.
🟡 O nível de auditoria ainda está em validação.
Princípio geral
Quando uma regra de negócio não estiver definida:
1. Não assumir.
2. Marcar como 🟡 EM VALIDAÇÃO.
3. Validar com a MEGA.
4. Somente depois transformar a regra em implementação definitiva.
A estrutura técnica deve representar a operação real da MEGA.

Assim os três arquivos ficam coerentes em tamanho:

```text
docs/
├── PROJECT-CONTEXT.md   → visão geral
├── BUSINESS-RULES.md    → regras do negócio
└── TECHNICAL.md         → regras técnicas
````
