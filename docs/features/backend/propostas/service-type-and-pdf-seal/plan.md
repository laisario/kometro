# Feature: Proposal Service Type, Effective Type Resolution and PDF Seal

## Feature Summary

Add a `tipo_servico` field to proposals, define a centralized and efficient rule to resolve the **effective service type** (considering both instruments and the proposal field), and ensure that the proposal PDF seal is only applied when the **effective type** is `acreditado`.

## User Value

### Context and Current Problem

Today, proposals do not have a clear, explicit classification of service type that ties directly to the rule for applying the seal in the PDF. The seal can be used without a consistent rule that considers:
- whether the instruments in the proposal are accredited; and
- whether the user explicitly set a service type for the proposal.

This can generate:
- inconsistências de compliance (selo aplicado em propostas não acreditadas);
- dificuldade de auditoria (por que o selo foi aplicado?); e
- duplicação de regra em pontos diferentes do código.

### Objective

- Introduce:
  - a persisted field `tipo_servico` on `Proposta` with values:
    - `acreditado`
    - `nao_acreditado`
  - a **centralized domain function** to compute the **effective service type**:
    - first by inferring from proposal instruments;
    - then allowing `proposta.tipo_servico` to override the inferred value when filled.
  - a clear rule that the **PDF seal** is only applied when the **effective service type** is `acreditado`.

### Who Benefits

- **Comercial/Comercial Técnico**: controla explicitamente o tipo de serviço da proposta.
- **Qualidade/Auditoria**: rastreabilidade da regra de uso do selo e dos critérios para considerar algo acreditado.
- **Clientes**: recebem propostas coerentes com o status de acreditação do serviço.

## Business Rules

### Service Type Field

1. `Proposta` ganha o campo `tipo_servico`.
2. Valores permitidos:
   - `acreditado`
   - `nao_acreditado`
3. `tipo_servico` pode ser:
   - não preenchido (nulo / vazio) em propostas antigas ou quando o usuário ainda não definiu explicitamente;
   - explicitamente definido pelo usuário no fluxo de criação/edição/elaboração.

### Inference from Instruments (Base Rule)

1. A inferência automática considera **apenas os instrumentos associados à proposta**.
2. Se **pelo menos 1 instrumento** da proposta for classificado como acreditado:
   - `tipo_servico_inferido = acreditado`.
3. Se **nenhum instrumento** for acreditado:
   - `tipo_servico_inferido = nao_acreditado`.

*(A forma exata de marcar o instrumento como acreditado depende do modelo existente — ex.: flag booleana `acreditado` em um modelo intermediário de itens de proposta ou no próprio instrumento. A regra aqui é conceitual, a implementação deve usar o campo já existente para indicar acreditação do instrumento.)*

### Override by Proposal Field (Manual Service Type)

1. Se `proposta.tipo_servico` estiver preenchido:
   - este valor **tem prioridade** sobre o valor inferido.
2. Se `proposta.tipo_servico` **não** estiver preenchido:
   - usar `tipo_servico_inferido` como padrão.

### Effective Service Type Resolution (Final Rule)

- Definir o conceito de **tipo efetivo da proposta**:
  - `tipo_servico_efetivo` é o valor final a ser usado para decisões de negócio (ex.: selo no PDF).

- Regra de prioridade:
  1. Calcular `tipo_servico_inferido` a partir dos instrumentos da proposta.
  2. Se `proposta.tipo_servico` estiver preenchido:
     - `tipo_servico_efetivo = proposta.tipo_servico`.
  3. Caso contrário:
     - `tipo_servico_efetivo = tipo_servico_inferido`.

### PDF Seal Rule

1. O selo no PDF **depende exclusivamente** de `tipo_servico_efetivo`.
2. Se `tipo_servico_efetivo = acreditado`:
   - o selo **deve** ser enviado/aplicado no PDF.
3. Se `tipo_servico_efetivo = nao_acreditado`:
   - o selo **não deve** ser enviado/aplicado no PDF.
4. A decisão do selo deve ser:
   - centralizada em uma função de domínio;
   - reaproveitável por outros fluxos além do PDF (ex.: regras de pricing, relatórios).

## Performance and Efficiency Requirements

- The effective service type resolution must:
  - avoid loading all instruments in memory when not necessary;
  - avoid multiple redundant queries to the database;
  - avoid recomputing the same rule in multiple places;
  - be implemented in a **single domain function** that:
    - uses efficient database primitives (e.g. `exists()` / `EXISTS` queries);
    - can leverage already-fetched relations when available, to avoid extra queries.

### Proposed Domain Helper

Introduce a **domain-level helper** (e.g. in `app/propostas/services.py` or similar):

```python
def resolve_tipo_servico_efetivo(proposta) -> str:
    """
    Retorna o tipo de serviço efetivo da proposta:
    - Primeiro infere com base nos instrumentos.
    - Depois sobrescreve com proposta.tipo_servico, se preenchido.
    """
```

Sem amarrar a detalhes de implementação, a função deve:

1. Verificar se os instrumentos da proposta contêm algum item acreditado:
   - Usar uma consulta baseada em `EXISTS`, por exemplo:
     - `PropostaInstrumento.objects.filter(proposta=proposta, instrumento__acreditado=True).exists()`
   - Ou equivalente na estrutura real de modelos, sempre usando `exists()` (ou `.any()` equivalente no ORM) para evitar carregar coleções completas.
2. Definir `tipo_servico_inferido`:
   - `acreditado` se a consulta `exists()` retornar `True`.
   - `nao_acreditado` caso contrário.
3. Aplicar a prioridade do campo manual:
   - Se `proposta.tipo_servico` estiver preenchido:
     - retornar `proposta.tipo_servico`.
   - Caso contrário:
     - retornar `tipo_servico_inferido`.

### Reuse and Caching Considerations

- A função `resolve_tipo_servico_efetivo` deve ser:
  - pura em termos de negócio (não causar efeitos colaterais);
  - fácil de testar com propostas e conjuntos de instrumentos montados em fixture.

- Potenciais otimizações:
  - Se a consulta `exists()` puder se basear em relações já carregadas (ex.: `prefetch_related` em listas de propostas), o código pode detectar isso e usar dados em memória ao invés de uma nova query.
  - Em fluxos de alta frequência (ex.: geração em lote de PDFs), é possível considerar armazenar o resultado em um campo derivado persistido/cached, mas isso está **fora de escopo imediato** e pode ser tratado em feature futura. A função de resolução já deixa esse caminho aberto.

## Backend Changes

### Entities

- `Proposta`
  - New field: `tipo_servico`
    - `CharField` com `choices`:
      - `("acreditado", "Acreditado")`
      - `("nao_acreditado", "Não acreditado")`
    - Pode ter `null=True` e/ou `blank=True` para permitir propostas antigas sem valor explicitamente definido.
    - Opcionalmente, pode ter default `"nao_acreditado"` se quisermos comportamento conservador ao criar novas propostas sem escolha explícita.

### Endpoints Impacted

- `POST /propostas/` — Create proposal
- `PATCH /propostas/{id}/` — Update proposal
- `PATCH /propostas/{id}/elaborar/` — Elaborate proposal
- `GET /propostas/{id}/` — Proposal details
- `GET /propostas/` — List proposals
- Qualquer endpoint adicional que exponha dados centrais de `Proposta`.

### Serializers / Schemas

- `PropostaSerializer` (principal):
  - Adicionar campo `tipo_servico` (ChoiceField) com os dois valores aceitos.
  - Incluir `tipo_servico` em `fields`.
  - Garantir validação de valores inválidos.

- Serializers de lista (`PropostaListSerializer`, se houver):
  - Incluir `tipo_servico` para permitir badges/indicadores na listagem.

- Serializer de elaboração (`ElaborarPropostaSerializer` ou similar):
  - Incluir `tipo_servico` no corpo de entrada, permitindo que o usuário defina/ajuste no momento da elaboração.
  - Ajustar `update`/`save` para persistir `tipo_servico` na `Proposta`.

### Create / Update Behavior

- **Create (`POST /propostas/`)**:
  - Aceitar `tipo_servico` no payload.
  - Persistir o valor se fornecido.
  - Se não fornecido:
    - Opcional: aplicar default `"nao_acreditado"` (decisão de negócio).

- **Update (`PATCH /propostas/{id}/`)**:
  - Permitir atualizar `tipo_servico` enquanto a proposta estiver em status editável (ex.: rascunho).
  - Bloquear a alteração em estados avançados se existir essa regra em outras partes (fora do escopo desta doc, mas pode ser ligada aos mesmos mecanismos de permissão/validação existentes).

- **Elaborar (`PATCH /propostas/{id}/elaborar/`)**:
  - Aceitar `tipo_servico` opcional no payload.
  - Se fornecido, atualizar `proposta.tipo_servico` antes de gerar o PDF.
  - Se não fornecido:
    - manter o valor atual de `proposta.tipo_servico` (que pode ser `NULL`).

### Reading / Listing Behavior

- Todos os serializers que retornam dados centrais de `Proposta` devem incluir `tipo_servico`.
- Isso permite que o frontend:
  - mostre o valor atual;
  - pré-preencha formulários;
  - exiba indicadores de acreditação.

## PDF Generation Impact

### Current Behavior (Reference)

- O fluxo de elaborar proposta (`PATCH /propostas/{id}/elaborar/`) já:
  - atualiza os dados da proposta;
  - cria um registro de `Revisao`;
  - chama uma rotina/tarefa de geração de PDF (ex.: `gerar_pdf_proposta`).

### New Behavior

- Antes de chamar a função/tarefa de geração de PDF:
  1. Resolver o `tipo_servico_efetivo` usando `resolve_tipo_servico_efetivo(proposta)`.
  2. Derivar um booleano `aplicar_selo`:
     - `True` se `tipo_servico_efetivo == "acreditado"`;
     - `False` caso contrário.
  3. Passar `aplicar_selo` (ou equivalente) para a camada de PDF:
     - `gerar_pdf_proposta(proposta_id=proposta.id, aplicar_selo=aplicar_selo, ...)`

- Dentro da lógica de PDF:
  - O selo só deve ser desenhado/incluído quando `aplicar_selo=True`.
  - Não deve haver lógica adicional tentando inferir tipo de serviço — a decisão já vem resolvida.

### Centralization of Logic

- A decisão de `tipo_servico_efetivo` e, consequentemente, de `aplicar_selo` deve existir em **um único lugar**:
  - `resolve_tipo_servico_efetivo` no domínio;
  - Uma função derivada simples:

```python
def should_apply_seal(proposta) -> bool:
    return resolve_tipo_servico_efetivo(proposta) == "acreditado"
```

- Outros pontos do sistema que em algum momento precisem saber se a proposta é tratada como acreditada devem usar exatamente essas funções.

## Request/Response Payloads (Examples)

### Elaborate Proposal — Request Body (Extended)

`PATCH /propostas/{id}/elaborar/`

```json
{
  "condicao_de_pagamento": "30 dias",
  "transporte": "Coleta no cliente",
  "validade": "2025-02-15",
  "dias_uteis": 10,
  "desconto_percentual": 5.0,
  "informacoes_adicionais": "Additional notes",
  "tipo_servico": "acreditado"
}
```

### Proposal Details — Response (Excerpt)

`GET /propostas/{id}/`

```json
{
  "id": 123,
  "numero": "P-2026-0001",
  "status": "AA",
  "cliente": {
    "id": 10,
    "nome": "Hospital Exemplo"
  },
  "tipo_servico": "acreditado",
  "total_sem_desconto": 10000.0,
  "desconto_percentual": 5.0,
  "total_com_desconto": 9500.0
}
```

## Expected Behavior Examples

### Case 1

- Proposta sem `tipo_servico` preenchido (nulo/vazio).
- Possui pelo menos 1 instrumento acreditado.
- Inferência:
  - `tipo_servico_inferido = acreditado`.
  - `proposta.tipo_servico` vazio ⇒ não sobrescreve.
  - `tipo_servico_efetivo = acreditado`.
- Resultado:
  - PDF **com selo**.

### Case 2

- Proposta sem `tipo_servico` preenchido.
- Nenhum instrumento acreditado.
- Inferência:
  - `tipo_servico_inferido = nao_acreditado`.
  - `proposta.tipo_servico` vazio ⇒ não sobrescreve.
  - `tipo_servico_efetivo = nao_acreditado`.
- Resultado:
  - PDF **sem selo**.

### Case 3

- Proposta com `tipo_servico = nao_acreditado`.
- Instrumentos possuem pelo menos 1 item acreditado.
- Inferência:
  - `tipo_servico_inferido = acreditado` (pelos instrumentos).
  - `proposta.tipo_servico = nao_acreditado` ⇒ sobrescreve.
  - `tipo_servico_efetivo = nao_acreditado`.
- Resultado:
  - PDF **sem selo**.

### Case 4

- Proposta com `tipo_servico = acreditado`.
- Instrumentos não possuem item acreditado.
- Inferência:
  - `tipo_servico_inferido = nao_acreditado`.
  - `proposta.tipo_servico = acreditado` ⇒ sobrescreve.
  - `tipo_servico_efetivo = acreditado`.
- Resultado:
  - PDF **com selo**.

## Implementation Plan (Backend)

### Step 1 — Model and Migration

- Add `tipo_servico` field to `Proposta`:
  - CharField with choices (`acreditado`, `nao_acreditado`).
  - Allow null/blank or default `"nao_acreditado"` (a decidir).
- Generate and apply migration:
  - Backfill existing rows com valor default ou `NULL` (conforme definido).

### Step 2 — Domain Helper

- Implement `resolve_tipo_servico_efetivo(proposta)` in a service/domain module.
- Implement `should_apply_seal(proposta)` baseado em `resolve_tipo_servico_efetivo`.
- Cobrir essas funções com testes unitários independentes de ViewSets.

### Step 3 — Serializers

- Update main proposal serializers to:
  - Include `tipo_servico` field (read/write).
  - Validate allowed values.
- Update elaborate serializer to:
  - Accept optional `tipo_servico`.
  - Persist the field on `Proposta`.

### Step 4 — Views / ViewSets

- In create/update endpoints:
  - Ensure `tipo_servico` flows from serializer to model.
- In elaborate endpoint:
  - Apply any incoming `tipo_servico`.
  - After saving, call `resolve_tipo_servico_efetivo` / `should_apply_seal`.
  - Pass `aplicar_selo` para a geração de PDF.

### Step 5 — PDF Generation

- Update PDF generation entrypoint (task/service):
  - Accept `aplicar_selo` parameter.
  - Use this flag exclusively to decide if the seal is rendered.
- Remove any duplicated logic de selos contida nessa camada.

### Step 6 — Tests

- Add tests for:
  - Model field configuration for `tipo_servico`.
  - Serializer acceptance/rejection of values.
  - `resolve_tipo_servico_efetivo` e `should_apply_seal` cobrindo os quatro casos.
  - Elaborate endpoint chamando PDF com o flag correto nos diferentes cenários.

## Acceptance Criteria

- [ ] `Proposta` possui campo `tipo_servico` com valores `acreditado` e `nao_acreditado`.
- [ ] Create/update/elaborar aceitam e persistem `tipo_servico`.
- [ ] Proposal details/list retornam `tipo_servico`.
- [ ] Existe função de domínio centralizada para resolver `tipo_servico_efetivo`.
- [ ] A lógica de inferência por instrumentos usa consulta eficiente (ex.: `exists()`).
- [ ] `tipo_servico_efetivo` segue a prioridade:
  - primeiro inferência por instrumentos;
  - depois sobrescrita por `proposta.tipo_servico`, se preenchido.
- [ ] O selo no PDF é aplicado **apenas** quando `tipo_servico_efetivo = acreditado`.
- [ ] PDFs com `tipo_servico_efetivo = nao_acreditado` nunca recebem selo.
- [ ] Não há condicionais duplicadas de selo espalhadas; toda decisão parte da função centralizada.

## Technical and Performance Notes

- Prefer database `EXISTS` queries for instrument checks to avoid loading full collections.
- Keep the domain helper free of side effects and easy to test.
- Consider, em features futuras, persistir o tipo efetivo em campo derivado se surgirem necessidades de alta performance em relatórios ou filtros — sem mudar a API pública, apenas otimizando internamente.

