# Tipo de Serviço — Proposal Instrument Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Tipo" column to the proposal instrument tables so users can view and edit `tipo_de_servico` on each `InstrumentoDoCliente`, persisting the value when the proposal step is submitted.

**Architecture:** New `tipo_de_servico` field on `InstrumentoDoCliente` (values: `acreditado`, `nao_acreditado`, `interno`). Backend propagates it through existing proposal endpoints. Frontend adds a Select dropdown to `InstrumentServiceSelectionTable`, which renders both affected tables.

**Tech Stack:** Django 4.x, Django REST Framework, React 18, MUI v6, React Query v3, humps (auto camelCase), Jest/RTL.

---

## File Map

| File | Change |
|------|--------|
| `bef-backend/app/instrumentos/models.py` | Add `tipo_de_servico` field to `InstrumentoDoCliente` |
| `bef-backend/app/instrumentos/migrations/0061_instrumentodocliente_tipo_de_servico.py` | New migration (auto-generated) |
| `bef-backend/app/instrumentos/serializers.py` | Expose `tipo_de_servico` in read serializers |
| `bef-backend/app/propostas/serializers.py` | Accept `tipo_de_servico` in `InstrumentosField`; persist in create/update |
| `bef-backend/app/propostas/views.py` | Persist `tipo_de_servico` in `adicionar_instrumento` action |
| `bef-backend/app/propostas/tests.py` | New: backend tests for the new field |
| `frontend/src/proposals/components/InstrumentServiceSelectionTable.jsx` | Add Tipo column + handler |
| `frontend/src/proposals/hooks/useProposalMutations.js` | Include `tipo_de_servico` in all three payloads |
| `frontend/src/proposals/components/FormElaborate.jsx` | Carry `tipoDeServico` in items useEffect |
| `frontend/tests/components/InstrumentServiceSelectionTable.test.jsx` | New: frontend component test |

---

## Task 1: Add `tipo_de_servico` to `InstrumentoDoCliente` model and migrate

**Files:**
- Modify: `bef-backend/app/instrumentos/models.py`
- Create: `bef-backend/app/instrumentos/migrations/0061_instrumentodocliente_tipo_de_servico.py` (auto-generated)

- [ ] **Step 1.1: Add field to model**

In `bef-backend/app/instrumentos/models.py`, inside `class InstrumentoDoCliente(models.Model)`, add the field after the `criterio_frequencia` field (around line 140):

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

- [ ] **Step 1.2: Generate migration**

```bash
docker exec web python manage.py makemigrations instrumentos --name instrumentodocliente_tipo_de_servico
```

Expected output:
```
Migrations for 'instrumentos':
  app/instrumentos/migrations/0061_instrumentodocliente_tipo_de_servico.py
    - Add field tipo_de_servico to instrumentodocliente
```

- [ ] **Step 1.3: Apply migration**

```bash
docker exec web python manage.py migrate instrumentos
```

Expected output:
```
Applying instrumentos.0061_instrumentodocliente_tipo_de_servico... OK
```

- [ ] **Step 1.4: Verify field exists in database**

```bash
docker exec web python manage.py shell -c "
from instrumentos.models import InstrumentoDoCliente
fields = [f.name for f in InstrumentoDoCliente._meta.get_fields()]
print('tipo_de_servico' in fields)
"
```

Expected output: `True`

- [ ] **Step 1.5: Commit**

```bash
git add bef-backend/app/instrumentos/models.py bef-backend/app/instrumentos/migrations/0061_instrumentodocliente_tipo_de_servico.py
git commit -m "feat: add tipo_de_servico field to InstrumentoDoCliente"
```

---

## Task 2: Expose `tipo_de_servico` in serializers

**Files:**
- Modify: `bef-backend/app/instrumentos/serializers.py`

The two serializers that need updating are:
- `InstrumentoDoClienteReadSerializer` (lines ~603–647) — used when loading full proposal data
- `InstrumentoDoClienteAvailableSerializer` (lines ~359–372) — used by the instrument autocomplete

- [ ] **Step 2.1: Add to `InstrumentoDoClienteReadSerializer`**

In `InstrumentoDoClienteReadSerializer.Meta.fields` tuple, add `"tipo_de_servico"` after `"criterio_frequencia"`:

```python
class Meta:
    model = InstrumentoDoCliente
    fields = (
        "cliente",
        "instrumento",
        "tag",
        "numero_de_serie",
        "posicao",
        "data_proxima_calibracao",
        "data_ultima_calibracao",
        "id",
        "pontos_de_calibracao",
        "expirado",
        "calibracoes",
        "setor",
        "criterios_aceitacao",
        "classe",
        "frequencia_checagem",
        "frequencia_calibracao",
        "normativos",
        "historico_posicoes",
        "data_proxima_checagem",
        "data_ultima_checagem",
        "observacao",
        "historico_setores",
        "data_criacao",
        "preco_alternativo_calibracao",
        "criterio_frequencia",
        "checagens",
        "tipo_de_servico",       # ← add this
    )
```

- [ ] **Step 2.2: Add to `InstrumentoDoClienteAvailableSerializer`**

```python
class InstrumentoDoClienteAvailableSerializer(serializers.ModelSerializer):
    tipo_instrumento = TipoInstrumentoSimpleSerializer(source="instrumento.tipo_de_instrumento", read_only=True)
    tipo_servico = serializers.CharField(source="instrumento.tipo_de_servico", read_only=True)

    class Meta:
        model = InstrumentoDoCliente
        fields = [
            "id",
            "tag",
            "numero_de_serie",
            "tipo_instrumento",
            "tipo_servico",
            "tipo_de_servico",   # ← add this
        ]
```

- [ ] **Step 2.3: Verify with Django shell**

```bash
docker exec web python manage.py shell -c "
from instrumentos.models import InstrumentoDoCliente
from instrumentos.serializers import InstrumentoDoClienteAvailableSerializer, InstrumentoDoClienteReadSerializer
inst = InstrumentoDoCliente.objects.first()
if inst:
    print('Available:', InstrumentoDoClienteAvailableSerializer(inst).data.keys())
    print('Read:', 'tipo_de_servico' in InstrumentoDoClienteReadSerializer(inst).data)
"
```

Expected: both outputs show `tipo_de_servico` present.

- [ ] **Step 2.4: Commit**

```bash
git add bef-backend/app/instrumentos/serializers.py
git commit -m "feat: expose tipo_de_servico in InstrumentoDoCliente serializers"
```

---

## Task 3: Accept and persist `tipo_de_servico` in proposal serializers

**Files:**
- Modify: `bef-backend/app/propostas/serializers.py`

There are two serializer classes that handle instrument persistence: `WritePropostaSerializer` (used by non-admin create/update) and `PropostaAdminSerializer` (used by admin elaboration). Both share similar `create()` / `update()` patterns. `InstrumentosField` is the shared parser that normalizes the instrument list.

- [ ] **Step 3.1: Accept `tipo_de_servico` in `InstrumentosField.to_internal_value()`**

Locate the `InstrumentosField` class (around line 64). In the `isinstance(item, dict)` branch, after the `preco` validation block (around line 129), add:

```python
tipo_de_servico = item.get('tipo_de_servico')
if tipo_de_servico is not None and tipo_de_servico not in ['acreditado', 'nao_acreditado', 'interno']:
    raise serializers.ValidationError(
        f"tipo_de_servico deve ser 'acreditado', 'nao_acreditado' ou 'interno', recebeu: {tipo_de_servico}"
    )
normalized.append({
    'id': instrumento_id,
    'service_kind': service_kind,
    'local': local,
    'preco': preco,
    'tipo_de_servico': tipo_de_servico,  # ← add this key
})
```

Also update the `isinstance(item, (int, str))` branch to include the key (so it's always present):

```python
normalized.append({
    'id': instrumento_id,
    'service_kind': 'calibracao',
    'local': 'P',
    'preco': None,
    'tipo_de_servico': None,   # ← add this key
})
```

- [ ] **Step 3.2: Add helper function for persisting `tipo_de_servico`**

At module level in `propostas/serializers.py`, just before `WritePropostaSerializer`, add:

```python
def _persist_tipo_de_servico(instrumento, inst_data):
    """Update InstrumentoDoCliente.tipo_de_servico if provided in payload."""
    tipo = inst_data.get('tipo_de_servico')
    if tipo is not None:
        instrumento.tipo_de_servico = tipo
        instrumento.save(update_fields=['tipo_de_servico'])
```

- [ ] **Step 3.3: Call helper in `WritePropostaSerializer.create()`**

Find the `PropostaInstrumento.objects.create(...)` call in `WritePropostaSerializer.create()` (around line 214). After it, call the helper:

```python
PropostaInstrumento.objects.create(
    proposta=proposta,
    instrumento=instrumento,
    service_kind=inst_data.get('service_kind', 'calibracao'),
    local=local,
    preco=preco,
)
_persist_tipo_de_servico(instrumento, inst_data)   # ← add this line
instrument_ids.append(instrumento_id)
```

- [ ] **Step 3.4: Call helper in `WritePropostaSerializer.update()`**

Find the `PropostaInstrumento.objects.update_or_create(...)` call in `WritePropostaSerializer.update()` (around line 256). After it, call the helper:

```python
PropostaInstrumento.objects.update_or_create(
    proposta=instance,
    instrumento=instrumento,
    defaults={
        'service_kind': inst_data.get('service_kind', 'calibracao'),
        'local': local,
        'preco': preco,
    }
)
_persist_tipo_de_servico(instrumento, inst_data)   # ← add this line
instrument_ids.append(instrumento_id)
```

- [ ] **Step 3.5: Call helper in `PropostaAdminSerializer.create()`**

Find the `PropostaInstrumento.objects.create(...)` call in `PropostaAdminSerializer.create()` (around line 394). After it, call the helper:

```python
PropostaInstrumento.objects.create(
    proposta=proposta,
    instrumento=instrumento,
    service_kind=inst_data.get('service_kind', 'calibracao'),
    local=local,
)
_persist_tipo_de_servico(instrumento, inst_data)   # ← add this line
instrument_ids.append(instrumento_id)
```

- [ ] **Step 3.6: Call helper in `PropostaAdminSerializer.update()`**

Find the `PropostaInstrumento.objects.update_or_create(...)` call in `PropostaAdminSerializer.update()` (around line 440). After it, call the helper:

```python
PropostaInstrumento.objects.update_or_create(
    proposta=instance,
    instrumento=instrumento,
    defaults={
        'service_kind': inst_data.get('service_kind', 'calibracao'),
        'local': local,
        'preco': preco,
    }
)
_persist_tipo_de_servico(instrumento, inst_data)   # ← add this line
instrument_ids.append(instrumento_id)
```

- [ ] **Step 3.7: Commit**

```bash
git add bef-backend/app/propostas/serializers.py
git commit -m "feat: accept and persist tipo_de_servico in proposal serializers"
```

---

## Task 4: Persist `tipo_de_servico` in `adicionar_instrumento` view action

**Files:**
- Modify: `bef-backend/app/propostas/views.py`

The `adicionar_instrumento` action (line ~188) manually parses instrument dicts. It builds `proposta_instrumentos_to_create` with `{'instrumento', 'service_kind', 'local', 'preco'}`. We need to carry `tipo_de_servico` through.

- [ ] **Step 4.1: Read `tipo_de_servico` from payload in validation loop**

Find the block that reads `service_kind`, `local`, `preco` from each `item` (around line 207). Add `tipo_de_servico` extraction after `local`:

```python
if isinstance(item, dict):
    instrumento_id = item.get('id') or item.get('pk')
    service_kind = item.get('service_kind', 'calibracao')
    local = item.get('local', proposta.local or 'P')
    tipo_de_servico = item.get('tipo_de_servico')   # ← add this
else:
    instrumento_id = item
    service_kind = 'calibracao'
    local = proposta.local or 'P'
    tipo_de_servico = None                           # ← add this
```

- [ ] **Step 4.2: Pass `tipo_de_servico` into `proposta_instrumentos_to_create`**

Find the `proposta_instrumentos_to_create.append(...)` call (around line 247). Add the key:

```python
proposta_instrumentos_to_create.append({
    'instrumento': instrumento,
    'service_kind': service_kind,
    'local': local,
    'preco': preco,
    'tipo_de_servico': tipo_de_servico,   # ← add this
})
```

- [ ] **Step 4.3: Persist `tipo_de_servico` after `PropostaInstrumento.update_or_create`**

Find the `PropostaInstrumento.objects.update_or_create(...)` loop (around line 266). After it, add:

```python
for item_data in proposta_instrumentos_to_create:
    PropostaInstrumento.objects.update_or_create(
        proposta=proposta,
        instrumento=item_data['instrumento'],
        defaults={
            'service_kind': item_data['service_kind'],
            'local': item_data['local'],
            'preco': item_data['preco'],
        }
    )
    if item_data.get('tipo_de_servico') is not None:   # ← add these 3 lines
        item_data['instrumento'].tipo_de_servico = item_data['tipo_de_servico']
        item_data['instrumento'].save(update_fields=['tipo_de_servico'])
```

- [ ] **Step 4.4: Commit**

```bash
git add bef-backend/app/propostas/views.py
git commit -m "feat: persist tipo_de_servico in adicionar_instrumento action"
```

---

## Task 5: Backend tests

**Files:**
- Create: `bef-backend/app/propostas/tests.py`

- [ ] **Step 5.1: Write tests**

Create `bef-backend/app/propostas/tests.py`:

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from clientes.models import Cliente
from instrumentos.models import InstrumentoDoCliente, Instrumento, TipoInstrumento

User = get_user_model()


def make_instrumento(cliente):
    tipo = TipoInstrumento.objects.create(descricao="Termômetro", fabricante="X", modelo="M1")
    instr = Instrumento.objects.create(tipo_de_instrumento=tipo)
    return InstrumentoDoCliente.objects.create(
        cliente=cliente,
        instrumento=instr,
        tag="TAG-001",
    )


class TipoDeServicoFieldTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="staff", password="pass", is_staff=True)
        self.cliente = Cliente.objects.create(
            empresa="Empresa Teste",
            instrumentos_cadastrados=0,
        )
        self.user.cliente = self.cliente
        self.user.save()
        self.instrumento = make_instrumento(self.cliente)

    def test_tipo_de_servico_defaults_to_null(self):
        self.assertIsNone(self.instrumento.tipo_de_servico)

    def test_tipo_de_servico_accepts_valid_values(self):
        for value in ['acreditado', 'nao_acreditado', 'interno']:
            self.instrumento.tipo_de_servico = value
            self.instrumento.save(update_fields=['tipo_de_servico'])
            self.instrumento.refresh_from_db()
            self.assertEqual(self.instrumento.tipo_de_servico, value)

    def test_tipo_de_servico_included_in_available_serializer(self):
        from instrumentos.serializers import InstrumentoDoClienteAvailableSerializer
        self.instrumento.tipo_de_servico = 'acreditado'
        self.instrumento.save(update_fields=['tipo_de_servico'])
        data = InstrumentoDoClienteAvailableSerializer(self.instrumento).data
        self.assertIn('tipo_de_servico', data)
        self.assertEqual(data['tipo_de_servico'], 'acreditado')

    def test_tipo_de_servico_included_in_read_serializer(self):
        from instrumentos.serializers import InstrumentoDoClienteReadSerializer
        self.instrumento.tipo_de_servico = 'interno'
        self.instrumento.save(update_fields=['tipo_de_servico'])
        data = InstrumentoDoClienteReadSerializer(self.instrumento).data
        self.assertEqual(data['tipo_de_servico'], 'interno')


class AdicionarInstrumentoTipoDeServicoTest(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(username="staff2", password="pass", is_staff=True)
        self.cliente = Cliente.objects.create(
            empresa="Empresa Teste 2",
            instrumentos_cadastrados=0,
        )
        self.user.cliente = self.cliente
        self.user.save()
        self.client_api.force_authenticate(user=self.user)
        self.instrumento = make_instrumento(self.cliente)

    def _create_proposta(self):
        from propostas.models import Proposta
        return Proposta.objects.create(cliente=self.cliente)

    def test_adicionar_instrumento_persists_tipo_de_servico(self):
        proposta = self._create_proposta()
        resp = self.client_api.post(
            f'/propostas/{proposta.id}/adicionar_instrumento/',
            {
                'instrumentos': [
                    {
                        'id': self.instrumento.id,
                        'service_kind': 'calibracao',
                        'local': 'P',
                        'tipo_de_servico': 'nao_acreditado',
                    }
                ]
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 200)
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.tipo_de_servico, 'nao_acreditado')

    def test_adicionar_instrumento_null_tipo_de_servico_does_not_overwrite(self):
        self.instrumento.tipo_de_servico = 'acreditado'
        self.instrumento.save(update_fields=['tipo_de_servico'])
        proposta = self._create_proposta()
        resp = self.client_api.post(
            f'/propostas/{proposta.id}/adicionar_instrumento/',
            {
                'instrumentos': [
                    {
                        'id': self.instrumento.id,
                        'service_kind': 'calibracao',
                        'local': 'P',
                    }
                ]
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 200)
        self.instrumento.refresh_from_db()
        # No tipo_de_servico in payload → existing value preserved
        self.assertEqual(self.instrumento.tipo_de_servico, 'acreditado')
```

- [ ] **Step 5.2: Run tests**

```bash
docker exec web python manage.py test propostas.tests --keepdb --verbosity=2
```

Expected: all tests pass. If `Cliente` model constructor differs, adjust `setUp` to match the actual required fields (check `clientes/models.py` if needed).

- [ ] **Step 5.3: Commit**

```bash
git add bef-backend/app/propostas/tests.py
git commit -m "test: backend tests for tipo_de_servico on InstrumentoDoCliente"
```

---

## Task 6: Frontend — add Tipo column to `InstrumentServiceSelectionTable`

**Files:**
- Modify: `frontend/src/proposals/components/InstrumentServiceSelectionTable.jsx`

The component already has handlers for `service_kind`, `local`, and `preco`. The "Tipo" column follows the exact same pattern as "Local" (a MUI `Select`).

- [ ] **Step 6.1: Add `handleTipoDeServicoChange` handler**

After `handlePrecoChange` (around line 66), add:

```jsx
const handleTipoDeServicoChange = (instrumentId, value) => {
  const updated = instruments?.map(inst =>
    inst?.id === instrumentId ? { ...inst, tipoDeServico: value } : inst
  );
  onChange(updated);
};
```

- [ ] **Step 6.2: Add "Tipo" column header**

In `<TableHead>`, add a new `<TableCell>` after the "Local" cell and before the conditional "Preço" cell:

```jsx
<TableRow>
  <TableCell>Instrumento</TableCell>
  <TableCell>Tipo de Serviço</TableCell>
  <TableCell>Local</TableCell>
  <TableCell>Tipo</TableCell>                              {/* ← add this */}
  {showPreco && <TableCell align="right">Preço (R$)</TableCell>}
  <TableCell align="right">Ações</TableCell>
</TableRow>
```

- [ ] **Step 6.3: Add Tipo cell to each row**

In the `<TableBody>` row map, after the Local `<TableCell>` (around line 162), add:

```jsx
<TableCell>
  <FormControl fullWidth size="small">
    <Select
      value={instrument.tipoDeServico || ''}
      onChange={(e) => handleTipoDeServicoChange(instrument.id, e.target.value || null)}
      displayEmpty
    >
      <MenuItem value=""><em>Não definido</em></MenuItem>
      <MenuItem value="acreditado">Acreditado</MenuItem>
      <MenuItem value="nao_acreditado">Não acreditado</MenuItem>
      <MenuItem value="interno">Interno</MenuItem>
    </Select>
  </FormControl>
</TableCell>
```

- [ ] **Step 6.4: Commit**

```bash
git add frontend/src/proposals/components/InstrumentServiceSelectionTable.jsx
git commit -m "feat: add Tipo column to InstrumentServiceSelectionTable"
```

---

## Task 7: Frontend — include `tipo_de_servico` in mutation payloads

**Files:**
- Modify: `frontend/src/proposals/hooks/useProposalMutations.js`

Three functions send per-instrument data: `createProposal`, `addInstrument`, and `elaborate`.

- [ ] **Step 7.1: Update `createProposal`**

Around line 11–17, update the instrument mapping:

```js
const instrumentos = data?.instrumentos?.map(inst => {
  const local = inst.local || 'P';
  return {
    id: inst.id,
    service_kind: inst.service_kind || 'calibracao',
    local,
    tipo_de_servico: inst.tipoDeServico || null,   // ← add this
  };
}) || [];
```

- [ ] **Step 7.2: Update `addInstrument`**

Around line 85–93, update the instrument mapping:

```js
const formattedInstruments = newInstruments?.map(instrument => {
  const local = instrument.local || 'P';
  const preco = instrument.preco != null ? instrument.preco : getSuggestedPreco(instrument, local);
  return {
    id: instrument.id,
    service_kind: instrument.service_kind || 'calibracao',
    local,
    preco: preco != null ? preco : null,
    tipo_de_servico: instrument.tipoDeServico || null,   // ← add this
  };
}) || [];
```

- [ ] **Step 7.3: Update `elaborate`**

Around line 179–184, update the instrument mapping:

```js
const instrumentos = formValues?.instrumentos?.map(it => ({
  id: it.id,
  service_kind: it.service_kind || 'calibracao',
  local: it.local || 'P',
  preco: it.preco != null ? it.preco : null,
  tipo_de_servico: it.tipoDeServico || null,   // ← add this
})) || null;
```

- [ ] **Step 7.4: Commit**

```bash
git add frontend/src/proposals/hooks/useProposalMutations.js
git commit -m "feat: include tipo_de_servico in proposal mutation payloads"
```

---

## Task 8: Frontend — carry `tipoDeServico` when initializing `FormElaborate` items

**Files:**
- Modify: `frontend/src/proposals/components/FormElaborate.jsx`

When a proposal is loaded for elaboration, `items` is built from `data.instrumentos` merged with `data.instrumentosSelecoes`. The new field needs to be carried from the instrument data.

- [ ] **Step 8.1: Update items `useEffect`**

Find the `useEffect` that calls `setItems` (around line 60–74). Update the mapping:

```js
setItems(instrumentos.map((inst) => {
  const sel = selecoes.find(s => (s.instrumentoId ?? s.instrumento_id) === inst.id);
  const local = sel?.local ?? 'P';
  const serviceKind = sel?.serviceKind ?? sel?.service_kind ?? 'calibracao';
  const preco = sel?.preco != null ? Number(sel.preco) : null;
  return {
    ...inst,
    local,
    service_kind: serviceKind,
    preco,
    tipoDeServico: inst.tipoDeServico ?? null,   // ← add this
  };
}));
```

Note: `inst.tipoDeServico` is the camelCased version of `tipo_de_servico` returned by `InstrumentoDoClienteReadSerializer`, auto-converted by the humps axios interceptor.

- [ ] **Step 8.2: Commit**

```bash
git add frontend/src/proposals/components/FormElaborate.jsx
git commit -m "feat: carry tipoDeServico when initializing FormElaborate items"
```

---

## Task 9: Frontend tests for `InstrumentServiceSelectionTable`

**Files:**
- Create: `frontend/tests/components/InstrumentServiceSelectionTable.test.jsx`

- [ ] **Step 9.1: Write test file**

```jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InstrumentServiceSelectionTable from '../../src/proposals/components/InstrumentServiceSelectionTable';

const baseInstrument = {
  id: 1,
  tag: 'TAG-001',
  numeroDeSerie: 'SN-123',
  instrumento: {
    tipoDeInstrumento: { descricao: 'Termômetro' },
    precoCalibracaoNoCliente: '100.00',
    precoCalibracaoNoLaboratorio: '80.00',
  },
  service_kind: 'calibracao',
  local: 'P',
  tipoDeServico: null,
  preco: null,
};

describe('InstrumentServiceSelectionTable', () => {
  it('renders Tipo column header', () => {
    render(
      <InstrumentServiceSelectionTable
        instruments={[baseInstrument]}
        onChange={() => {}}
        onRemove={() => {}}
      />
    );
    expect(screen.getByText('Tipo')).toBeInTheDocument();
  });

  it('renders Tipo select with Não definido when tipoDeServico is null', () => {
    render(
      <InstrumentServiceSelectionTable
        instruments={[baseInstrument]}
        onChange={() => {}}
        onRemove={() => {}}
      />
    );
    expect(screen.getByDisplayValue('Não definido')).toBeInTheDocument();
  });

  it('shows current tipoDeServico value when pre-set', () => {
    const instrument = { ...baseInstrument, tipoDeServico: 'acreditado' };
    render(
      <InstrumentServiceSelectionTable
        instruments={[instrument]}
        onChange={() => {}}
        onRemove={() => {}}
      />
    );
    expect(screen.getByDisplayValue('Acreditado')).toBeInTheDocument();
  });

  it('calls onChange with updated tipoDeServico when select changes', () => {
    const handleChange = jest.fn();
    render(
      <InstrumentServiceSelectionTable
        instruments={[baseInstrument]}
        onChange={handleChange}
        onRemove={() => {}}
      />
    );
    fireEvent.change(screen.getByRole('combobox', { name: '' }), {
      target: { value: 'nao_acreditado' },
    });
    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, tipoDeServico: 'nao_acreditado' }),
      ])
    );
  });

  it('Tipo column appears in showPreco=true mode', () => {
    render(
      <InstrumentServiceSelectionTable
        instruments={[baseInstrument]}
        onChange={() => {}}
        onRemove={() => {}}
        showPreco
      />
    );
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Preço (R$)')).toBeInTheDocument();
  });
});
```

- [ ] **Step 9.2: Run tests**

```bash
cd frontend && npm test -- --testPathPattern=InstrumentServiceSelectionTable --watchAll=false
```

Expected: 5 tests pass.

- [ ] **Step 9.3: Commit**

```bash
git add frontend/tests/components/InstrumentServiceSelectionTable.test.jsx
git commit -m "test: InstrumentServiceSelectionTable Tipo column"
```

---

## Task 10: Smoke test end-to-end

- [ ] **Step 10.1: Open the app and create a proposal**

Navigate to `http://localhost:5173/#/propostas`. Click "Criar proposta". Add at least two instruments. Verify the "Tipo" column appears in the "Configurar serviços para cada instrumento" table with the dropdown showing "Não definido".

- [ ] **Step 10.2: Set different Tipo values and submit**

Set one instrument to "Acreditado", another to "Interno". Submit. Reopen the proposal detail. Open "Elaborar". Verify the "Tipo" dropdown in "Instrumentos e preços" shows the saved values.

- [ ] **Step 10.3: Verify persistence in database**

```bash
docker exec web python manage.py shell -c "
from instrumentos.models import InstrumentoDoCliente
for i in InstrumentoDoCliente.objects.exclude(tipo_de_servico=None)[:5]:
    print(i.id, i.tag, i.tipo_de_servico)
"
```

- [ ] **Step 10.4: Test FormAddInstrument**

Open an existing proposal, click "Adicionar instrumento", add a new instrument with "Não acreditado" set. Confirm. Verify via shell that the value was saved.

- [ ] **Step 10.5: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: smoke test corrections for tipo_de_servico flow"
```
