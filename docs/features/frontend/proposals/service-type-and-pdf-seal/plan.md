# Feature: Proposal Service Type Select, Effective Type Priority and PDF Seal

## Feature Summary

Add a `tipo_servico` select field to the elaborate proposal form, aligned with backend rules for effective service type resolution (inference from instruments + override by proposal field), ensuring the UI clearly reflects that the PDF seal depends on the **effective** type, not only on instruments or the raw field alone.

## Context and Problem

- Currently, the UI does not expose a clear `tipo_servico` field for proposals.
- The logic of when a proposal is treated as accredited is implicit or only inferred by instruments, and the user cannot easily override the inference when necessary.
- The PDF seal rule will be centralized in the backend based on an **effective service type**; the frontend must:
  - allow explicit setting of `tipo_servico`;
  - reflect the current status to the user;
  - avoid criar expectativas erradas sobre o selo do PDF.

## Objective

- Provide a simple, explicit control for the user to set `tipo_servico` in the elaborate form.
- Display `tipo_servico` in proposal details.
- Ensure the frontend:
  - sends `tipo_servico` when elaborating;
  - respects that this field **overrides** the automatic inference based on instruments;
  - stays consistent with the backend’s effective type and seal rules.

## Scope

### In Scope

- Add `tipo_servico` select to the elaborate proposal form.
- Load and display `tipo_servico` in proposal details.
- Include `tipo_servico` in the elaborate proposal payload.
- Keep UI copy aligned with the rule that the PDF seal depends on the **effective** type.

### Out of Scope

- Complex visual redesign of proposal pages.
- New filters by service type on lists (pode ser feito em feature futura).
- Expor os detalhes internos da inferência por instrumentos (isso fica encapsulado no backend).

## Business Rules (Frontend Perspective)

1. The elaborate proposal form must display a select for `tipo_servico`.
2. Options:
   - `acreditado`
   - `nao_acreditado`
3. The field `tipo_servico` is:
   - sent to the backend when present;
   - treated as an **explicit override** of the inferred type based on instruments.
4. The UI must not offer a way to “forçar selo” independentemente da regra do backend:
   - the seal is ultimately decided based on the **effective type** computed in the backend.

## Priority Rule and Effective Type (UI Explanation)

The backend defines the **effective service type** (`tipo_servico_efetivo`) with this priority:

1. Infer from instruments:
   - if at least one instrument is accredited → inferred type `acreditado`;
   - otherwise → inferred type `nao_acreditado`.
2. Override by `proposta.tipo_servico`:
   - if the proposal field is filled (`acreditado` or `nao_acreditado`), it **overwrites** the inferred type.
3. Resulting `tipo_servico_efetivo` is used to decide seal usage in PDF.

Frontend implications:

- When the user sets `tipo_servico` in the form, they are effectively overriding the inference:
  - e.g. set `nao_acreditado` even if instruments are accredited → effective type will be `nao_acreditado`.
- UI must communicate (via label/help text) that:
  - `tipo_servico` impacts whether the proposal is treated as accredited for the PDF seal.
  - The final decision uses both instruments and this field, with the field taking precedence when set.

## Frontend Changes

### Screens/Components

- `ProposalDetailsPage.jsx`
  - Consumes API data including `tipo_servico`.
  - Displays the current service type as part of proposal information.

- `InformationProposal.jsx`
  - Add a line/field: `Tipo de serviço`:
    - Display `"Acreditado"` when `tipo_servico === "acreditado"`.
    - Display `"Não acreditado"` when `tipo_servico === "nao_acreditado"`.
    - Fallback (e.g. `"-"`) when value is missing.

- `FormElaborate.jsx`
  - Elaborate proposal form.
  - Add a select input bound to `tipo_servico`.

## Data & API Integration

### Data Model (Frontend)

Extend the proposal shape used in the frontend to include:

```ts
type Proposta = {
  // ...
  tipo_servico?: "acreditado" | "nao_acreditado" | null;
};
```

### Read Flows

- When loading proposal details (`GET /propostas/{id}/`):
  - Read `tipo_servico` from the response.
  - Use it to:
    - display the label in the details page;
    - pre-fill the elaborate form.

### Write Flows — Elaborate Proposal

- Endpoint: `PATCH /propostas/{id}/elaborar/`
- Payload must include `tipo_servico` when the user has selected a value:

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

- If the form allows clearing the field:
  - Do not send `tipo_servico` or send `null`, alinhado com a convenção da API.

## Form Behavior

### Select Options

- Internal values:
  - `"acreditado"`
  - `"nao_acreditado"`

- Suggested constant inside `FormElaborate.jsx`:

```js
const SERVICE_TYPE_OPTIONS = [
  { value: "acreditado", label: "Acreditado" },
  { value: "nao_acreditado", label: "Não acreditado" }
];
```

### Default and Editing

- When opening elaborate form:
  - If `proposta.tipo_servico` is present:
    - Use that as the selected value.
  - If not present:
    - Option A (conservadora e simples): default `"nao_acreditado"`.
    - Option B: deixar sem seleção e forçar escolha (se compliance exigir).
  - A decisão entre A e B é de negócio, mas a doc deixa claro que a UI precisa estar alinhada com o backend:
    - qualquer valor salvo em `tipo_servico` terá prioridade na regra final.

### Validation

- The form should:
  - Prevent any value outside the two known options.
  - Show a validation message if a required choice is not made (quando o campo for obrigatório).

## Consistency with Backend Rules

- The frontend **does not** implement the full inference rule; it:
  - knows that instruments can make a proposal “inferred accredited”;
  - but delegates the actual effective type computation to the backend.

- The frontend **does**:
  - allow explicit override by sending `tipo_servico` in the elaborate payload;
  - display the current `tipo_servico` returned by the backend.

- Documentation note for developers:
  - Any UI “badge” or hint like “Proposta considerada acreditada” should be based on data explicitly provided pelo backend (e.g. no futuro um campo derivado) ou em `tipo_servico` em combinação com contexto, não em um cálculo frontend duplicado.

## PDF Seal Rule (Frontend Perspective)

### Current Behavior (Reference)

- The elaborate action triggers backend PDF generation.
- There may already be:
  - a button to download/preview PDF;
  - UI texts mentioning selo or accredited proposals.

### New Behavior

- The frontend must reflect this rule in copy/UX:
  - The **PDF seal** is applied **only when the effective type is `acreditado`**.
  - The effective type is:
    - first inferred from instruments; then
    - potentially overridden by `tipo_servico` when filled.

- UI guidance (examples de textos):
  - On elaborate form:
    - “O tipo de serviço impacta se o selo de acreditação será aplicado no PDF. Quando definido aqui, ele sobrescreve a inferência automática pelos instrumentos.”
  - On proposal details (optional helper text):
    - “Selo no PDF: aplicado apenas quando o tipo efetivo da proposta é Acreditado.”

- The frontend must not:
  - expose a manual “apply seal” toggle that ignore backend rules.

## Expected Behavior Examples (End-to-End View)

*(Backend computes the effective type based on the rules; frontend ensures `tipo_servico` is correctly captured and sent.)*

### Case 1

- UI state:
  - `tipo_servico` **não preenchido** no formulário.
  - Pelo menos 1 instrumento acreditado associado à proposta.
- Behavior:
  - Frontend:
    - não envia `tipo_servico`, ou envia `null`.
  - Backend:
    - `tipo_servico_inferido = acreditado`.
    - `proposta.tipo_servico` vazio ⇒ não sobrescreve.
    - `tipo_servico_efetivo = acreditado`.
  - Result:
    - PDF **com selo**.

### Case 2

- UI state:
  - `tipo_servico` não preenchido.
  - Nenhum instrumento acreditado.
- Behavior:
  - Frontend:
    - não envia `tipo_servico`.
  - Backend:
    - `tipo_servico_inferido = nao_acreditado`.
    - `tipo_servico_efetivo = nao_acreditado`.
  - Result:
    - PDF **sem selo**.

### Case 3

- UI state:
  - Usuário define `tipo_servico = nao_acreditado` no select.
  - Há instrumentos acreditados na proposta.
- Behavior:
  - Frontend:
    - envia `"tipo_servico": "nao_acreditado"` na elaboração.
  - Backend:
    - `tipo_servico_inferido = acreditado` (pela base de instrumentos).
    - `proposta.tipo_servico = nao_acreditado` ⇒ sobrescreve.
    - `tipo_servico_efetivo = nao_acreditado`.
  - Result:
    - PDF **sem selo**.

### Case 4

- UI state:
  - Usuário define `tipo_servico = acreditado` no select.
  - Não há instrumentos acreditados.
- Behavior:
  - Frontend:
    - envia `"tipo_servico": "acreditado"` na elaboração.
  - Backend:
    - `tipo_servico_inferido = nao_acreditado` (sem instrumentos acreditados).
    - `proposta.tipo_servico = acreditado` ⇒ sobrescreve.
    - `tipo_servico_efetivo = acreditado`.
  - Result:
    - PDF **com selo**.

## Implementation Plan (Frontend)

### Step 1 — Extend Proposal Types

- Update the shared proposal type/interface to include `tipo_servico?: "acreditado" | "nao_acreditado" | null`.

### Step 2 — Integrate with Proposal Details

- In `ProposalDetailsPage.jsx` / `InformationProposal.jsx`:
  - Read `tipo_servico` from the API response.
  - Display mapped label:
    - `"Acreditado"` / `"Não acreditado"` / `"-"` (quando ausente).
  - Optionally, render helper text referencing the PDF seal rule.

### Step 3 — Elaborate Form Wiring

- In `FormElaborate.jsx`:
  - Add `tipo_servico` to form state (React Hook Form / Formik / custom).
  - Initialize:
    - With `proposta.tipo_servico` when available.
    - Otherwise, com default (e.g. `"nao_acreditado"` ou vazio).
  - Render a select using `SERVICE_TYPE_OPTIONS`.
  - Ensure the field is part of validation schema (if using Yup/Zod, etc.).

### Step 4 — API Call Update

- Update the service/hook responsible for `PATCH /propostas/{id}/elaborar/`:
  - Include `tipo_servico` from form values in the request body.
  - Align empty/null handling with backend expectations (não enviar ou enviar `null`).

### Step 5 — State Consistency

- After successful elaboration:
  - Update any cached proposal (React Query, Redux, etc.) com o novo `tipo_servico`.
  - Ensure Proposal Details shows the updated value on navigation/refresh.

### Step 6 — Tests

- Add/adjust tests to verify:
  - The elaborate form renders the `tipo_servico` select.
  - Initial value comes from the proposal data when present.
  - The elaborate payload inclui `tipo_servico` conforme o valor selecionado.
  - Proposal details exibem o label corretamente.
  - Fluxos de edição/elaboração preservam o valor quando o usuário não o altera.

## Acceptance Criteria

- [ ] `tipo_servico` select presente no formulário de elaboração, com opções `Acreditado` / `Não acreditado`.
- [ ] Valor do select é pré-preenchido com `proposta.tipo_servico` quando retornado pela API.
- [ ] O payload de elaboração inclui `tipo_servico` quando o usuário seleciona um valor.
- [ ] Proposal Details exibe `Tipo de serviço` com label correto.
- [ ] A documentação e (opcionalmente) a cópia da UI deixam claro que:
  - o tipo efetivo final considera primeiro os instrumentos;
  - depois permite sobrescrita por `proposta.tipo_servico`;
  - o selo no PDF depende desse tipo efetivo final.

## Technical Notes

- Do not duplicate backend effective-type logic in the frontend:
  - keep frontend focused on capturing and sending `tipo_servico`;
  - rely on backend for the final decision.
- Keep the select options centralized (single constant) to avoid divergences de rótulos/valores.
- When introducing any new UI indicator about accreditation, always base it on backend data, not on local re-inference.

