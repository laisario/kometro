# Design: "Tipo" column in proposal instrument tables

**Date:** 2026-04-16
**Route:** `/propostas`
**Status:** Approved

---

## Goal

Add a "Tipo" column to the instrument tables in the proposal creation and elaboration flow, allowing users to view and edit `tipo_de_servico` on each `InstrumentoDoCliente`. Changes persist when the proposal step is submitted (inline with existing proposal API calls).

---

## Scope

### In scope
- Table: "Configurar serviços para cada instrumento" (FormCreateProposal, FormAddInstrument)
- Table: "Instrumentos e preços" (FormElaborate with `showPreco=true`)
- Backend: new field on `InstrumentoDoCliente`, serializer exposure, persistence via proposal endpoints

### Out of scope
- Immediate PATCH on dropdown change (deferred to proposal submit)
- Changes to the PDF generation or OS flow
- The proposal-level `tipo_servico` field (already exists on `Proposta`)

---

## Persistence strategy

**Option 1 — Inline save with proposal flow (chosen)**

`tipo_de_servico` is included in the per-instrument payload sent to the existing proposal endpoints. The backend updates `InstrumentoDoCliente.tipo_de_servico` when processing instrument data. No new API endpoints needed.

Endpoints affected:
- `POST /propostas/` (create)
- `POST /propostas/{id}/adicionar_instrumento/`
- `PATCH /propostas/{id}/elaborar/`

---

## Backend changes

### 1. `InstrumentoDoCliente` model (`instrumentos/models.py`)

Add field:
```python
tipo_de_servico = models.CharField(
    max_length=20,
    choices=[
        ("acreditado", "Acreditado"),
        ("nao_acreditado", "Não acreditado"),
        ("interno", "Interno"),
    ],
    null=True,
    blank=True,
    verbose_name="Tipo de serviço",
)
```

Run `python manage.py makemigrations instrumentos` and `migrate`.

### 2. Serializers (`instrumentos/serializers.py`)

Add `tipo_de_servico` to:
- `InstrumentoDoClienteReadSerializer.Meta.fields`
- `InstrumentoDoClienteAvailableSerializer.Meta.fields`

### 3. `InstrumentosField.to_internal_value()` (`propostas/serializers.py`)

Accept optional `tipo_de_servico` in each instrument dict. Allowed values: `acreditado`, `nao_acreditado`, `interno`, `None`. Pass through in the normalized dict.

### 4. `WritePropostaSerializer` and `PropostaAdminSerializer` (`propostas/serializers.py`)

In both `create()` and `update()`, after creating/updating `PropostaInstrumento`, persist `tipo_de_servico` on the instrument if provided:
```python
tipo_de_servico = inst_data.get('tipo_de_servico')
if tipo_de_servico is not None:
    instrumento.tipo_de_servico = tipo_de_servico
    instrumento.save(update_fields=['tipo_de_servico'])
```

### 5. `adicionar_instrumento` viewset action (`propostas/views.py`)

Locate the custom action. Apply the same `tipo_de_servico` persistence logic after instrument lookup.

---

## Frontend changes

### 1. `InstrumentServiceSelectionTable.jsx`

- Add handler: `handleTipoDeServicoChange(instrumentId, value)` — follows same pattern as `handleLocalChange`
- Add column header "Tipo" (between "Local" and "Preço (R$)"/"Ações")
- Add `Select` dropdown per row with options:
  - `""` → "(Não definido)" — shown when value is null/empty
  - `"acreditado"` → "Acreditado"
  - `"nao_acreditado"` → "Não acreditado"
  - `"interno"` → "Interno"
- Read initial value from `instrument.tipoDeServico` (camelCased from API)
- Applies to both `showPreco=false` and `showPreco=true` renders (same component)

### 2. `useProposalMutations.js`

Include `tipo_de_servico` in all three instrument payload mappings:

```js
// createProposal
{ id, service_kind, local, tipo_de_servico: inst.tipoDeServico || null }

// addInstrument
{ id, service_kind, local, preco, tipo_de_servico: instrument.tipoDeServico || null }

// elaborate
{ id, service_kind, local, preco, tipo_de_servico: it.tipoDeServico || null }
```

### 3. `FormElaborate.jsx`

In the `useEffect` that builds `items`, carry `tipoDeServico` from the loaded instrument:
```js
return { ...inst, local, service_kind: serviceKind, preco, tipoDeServico: inst.tipoDeServico ?? null };
```

### 4. `FormCreateProposal.jsx`

No change required. The `...inst` spread in the autocomplete `onChange` handler already carries all fields returned by the API, including `tipo_de_servico` (camelCased to `tipoDeServico` by humps) once the serializer exposes it.

---

## Data flow summary

```
VirtualizedInstrumentAutocomplete
  → GET /instrumentos/ (InstrumentoDoClienteAvailableSerializer)
  → returns tipoDeServico (new)

FormCreateProposal / FormAddInstrument / FormElaborate
  → user sees "Tipo" dropdown, edits value
  → InstrumentServiceSelectionTable fires onChange with updated tipoDeServico

useProposalMutations
  → sends tipo_de_servico in per-instrument payload

Backend (WritePropostaSerializer / PropostaAdminSerializer / adicionar_instrumento)
  → InstrumentosField passes tipo_de_servico through
  → InstrumentoDoCliente.tipo_de_servico is saved
```

---

## Manual test checklist

1. **Create proposal** — add instruments, set different "Tipo" values per row, submit → reload proposal → verify each instrument shows the saved Tipo
2. **No value set** — leave Tipo empty on creation → verify it saves as null, not as an error
3. **Add instrument to existing proposal** — open FormAddInstrument, set Tipo, confirm → verify persisted
4. **Elaborate proposal** — open FormElaborate, verify existing Tipo values are pre-populated, change one, save → verify updated
5. **Both tables** — confirm "Tipo" column appears in both "Configurar serviços" (showPreco=false) and "Instrumentos e preços" (showPreco=true)
6. **All three values** — exercise acreditado, nao_acreditado, interno to confirm all three save correctly
7. **No regression** — verify service_kind (radio), local (dropdown), and preco still work as before
