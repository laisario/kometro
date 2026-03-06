# Reassign Instruments to New OS
  
> **Status**: Planning  
> **Audience**: Backend + Frontend  
> **Last updated**: 2026-03-06  
> **Related**: OS V2 auto-generation + grouping rules ([create-on-approval/plan.v2.md](../create-on-approval/plan.v2.md))

## 1) Feature title

**Reassign instruments to a newly created OS**  
(aka: move instruments to new OS, create new OS with selected instruments)

## 2) Context

Today, instruments are linked to an `OrdemServico` through the `InstrumentoOS` "through model".

Operationally, the team needs to correct grouping mistakes or operational changes by **moving one or more instruments** from an OS to a **newly created OS**.

This must be safe and constrained by business rules:

- must stay within the **same proposal**
- must stay within the **same client**
- user must be able to **choose the type** of the new OS
- new OS is created with the selected type

### UI feature context (frontend)

Inside the OS details dialog (`OrdemServicoDetailsDialog`), the instrument table will support:

- selecting 1+ rows (checkbox per row)
- a contextual CTA **"Create new OS"** (or "Gerar nova OS")
- a dialog to choose the type of the new OS
- confirmation to create the new OS and move selected instruments

This document focuses on the backend feature support required for that flow (endpoints, validations, transactional behavior).

## 3) Business rules

### 3.1 Selection scope rules

- **BR-SEL-1**: Only instruments currently linked to the **origin OS** may be selected.
- **BR-SEL-2**: Movement must operate on the `InstrumentoOS` records corresponding to those instruments.

### 3.2 Proposal / client containment rules

- **BR-CTX-1**: Destination OS must belong to the **same `proposta`** as the origin OS.
- **BR-CTX-2**: Because `cliente` is derived via `os.proposta.cliente`, **same proposal implies same client**; still validate explicitly when needed to prevent cross-tenant leakage.

### 3.3 OS type selection rules (critical)

The domain already has OS types:

- `CAL` (Calibração)
- `BAL` (Balanças)
- `MAN` (Manutenção)
- `EXT` (Serviços Externos)

#### Rule for creating a new OS

- **BR-TYPE-NEW-1**: The user must **explicitly choose** the `tipo_os` for the new OS.
- **BR-TYPE-NEW-2**: The chosen type must be a valid `TipoOS` choice (`CAL`, `BAL`, `MAN`, or `EXT`).
- **BR-TYPE-NEW-3**: The new OS is created with the user-selected type (no automatic inheritance from origin OS).
- **BR-TYPE-NEW-4**: The new OS must belong to the same proposal as the origin OS.

##### Rationale

Allowing the user to choose the OS type provides flexibility to reorganize instruments into different service types when needed. The system validates that the chosen type is valid according to the domain model.

### 3.4 Validations and rejection behavior

- **BR-VAL-1**: If any selected instrument is not linked to origin OS → reject with `400` and list invalid IDs.
- **BR-VAL-2**: If `tipo_os` is not provided → `400` with error message.
- **BR-VAL-3**: If `tipo_os` is not a valid choice → `400` with list of valid types.
- **BR-VAL-4**: If origin OS is finalized/cancelled → `400` with appropriate error message.

### 3.5 Empty origin OS

When all instruments are moved out:

- **BR-EMPTY-1 (proposed)**: Allow the origin OS to become empty.
- **BR-EMPTY-2 (open)**: Decide what to do with empty OS:
  - keep it (status unchanged), or
  - auto-cancel it, or
  - block moving the last instrument unless target is chosen with explicit confirmation

### 3.6 Status restrictions

The OS domain has status machine: `AR` → `EA` → `RE`, and `CA`.

- **BR-STATUS-1**: Do not allow reassignment if origin OS is `REALIZADO` or `CANCELADO`.
- **BR-STATUS-2 (open)**: Is moving allowed when origin OS is `EM_ANDAMENTO`? (Probably yes, but confirm.)

### 3.7 Downstream records restrictions (certificates/billing/results)

This project includes certificate number assignment (`InstrumentoDoCliente.numero_certificado`) and calibration records (`Calibracao`, `Certificado`) that may reference OS numbers.

Potential constraints:

- **BR-DOWN-1 (open)**: If an instrument has downstream calibration results/certificates tied to the origin OS, is reassignment allowed?
- **BR-DOWN-2 (open)**: If billing/proposal billing release depends on OS completion state, does reassignment affect it?
- **BR-DOWN-3**: At minimum, reassignment must not silently invalidate/lose downstream records; if blocked, return clear message.

## 4) Backend scope

Backend responsibilities:

1. **Create new OS and move instruments**
   - validate origin OS and selected instruments
   - validate chosen OS type
   - create a new OS (same proposal/client, user-selected type)
   - move selection transactionally
2. **Consistency**
   - re-sequence `InstrumentoOS.item` on origin OS after move
   - enforce invariants (proposal/client)
   - prevent partial moves (atomic transaction)
3. **OS numbering**
   - generate OS number using pattern: `{proposta.numero}-OS-{tipo_os}-{count:03d}`
   - ensure uniqueness within proposal and type
4. **Audit/logging (recommended)**
   - log who moved what, from which OS to which new OS, and when
   - (future) persist this as a history table if needed

## 5) Data and domain analysis (current codebase)

### 5.1 Entities involved

- `propostas.Proposta`
  - owns many OS via `proposta.ordens_servico`
- `ordem_servico.OrdemServico`
  - `proposta` FK
  - `tipo_os`, `status`, `numero`
  - instruments linked via through model `InstrumentoOS` (`related_name="instrumentos_os"`)
- `ordem_servico.InstrumentoOS`
  - FK to `OrdemServico` and FK to `InstrumentoDoCliente`
  - has `item` which is unique per OS: `unique_together = (ordem_servico, item)`

### 5.2 What "moving instruments" means today

There is already an endpoint/action in `OrdemServicoViewSet`:

- `POST /ordens-servico/{id}/reallocar/`

It currently supports moving instruments to existing or new OSs. This feature will:

- **Remove** support for moving to existing OS
- **Keep and enhance** support for creating new OS
- **Add** requirement for user to choose OS type
- Support **bulk moves** (multiple instruments at once)
- **re-sequence origin OS** items to keep 1..N ordering after move

### 5.3 OS type validation

The `OrdemServico` model has a `tipo_os` field with choices defined in `TipoOS`:

- `CAL` (Calibração)
- `BAL` (Balanças)
- `MAN` (Manutenção)
- `EXT` (Serviços Externos)

The backend must validate that the user-provided `tipo_os` is one of these valid choices.

## 6) Backend rule: OS type selection and creation (implementation-ready proposal)

### 6.1 New OS creation rules

New OS creation:

- `tipo_os` = user-provided value (must be validated against `TipoOS.choices`)
- `proposta` = same as origin OS
- `status = AR` (A realizar)
- `numero` generated using existing numbering pattern (same as auto-generation):
  - `numero = f"{proposta.numero}-OS-{tipo_os}-{count:03d}"`
  - `count` = number of OSs of this type in the proposal + 1
  - ensure uniqueness (check if number exists, increment if needed)

### 6.2 Type validation

- Validate `tipo_os` is one of: `CAL`, `BAL`, `MAN`, `EXT`
- Return `400` with clear error if invalid type provided
- Return list of valid types in error response for user guidance

## 7) API design proposal (DRF, consistent with existing conventions)

The project already uses `@action` on `OrdemServicoViewSet` for OS operations (ex: `reallocar`, `gerar_certificado`, `finalizar`).

### 7.1 Create a new OS and move instruments into it (bulk)

**Route**:

- `POST /ordens-servico/{os_id}/reallocar/`

**Request body**:

```json
{
  "instrumento_ids": [17, 27, 35],
  "tipo_os": "CAL"
}
```

**Behavior**:

- server validates:
  - origin OS exists and is not finalized/cancelled
  - all selected instruments belong to origin OS
  - `tipo_os` is a valid choice (`CAL`, `BAL`, `MAN`, or `EXT`)
- server creates a new OS with:
  - same `proposta` as origin OS
  - `tipo_os` = user-provided value
  - `status = AR`
  - new `numero` generated: `{proposta.numero}-OS-{tipo_os}-{count:03d}`
- moves instruments into the new OS
- resequences origin OS items

**Response**:

```json
{
  "message": "Instrumentos realocados com sucesso.",
  "origin_os_id": 22,
  "destination_os_id": 999,
  "destination_os_numero": "XX-OS-CAL-003",
  "destination_os_tipo": "CAL",
  "moved_instrumento_ids": [17, 27, 35],
  "origin_items_resequenced": true
}
```

**Validations**:

- all selected instruments belong to origin OS
- `tipo_os` is provided and is a valid choice
- origin OS is not finalized/cancelled
- origin OS exists
- user has permission (gerente)

## 8) Transaction and consistency rules

### 8.1 Atomicity

- All operations must be wrapped in `transaction.atomic()`.
- If any validation fails (ownership, type mismatch, not found), **no instrument should move**.

### 8.2 Item sequencing

Because `InstrumentoOS.item` has a unique constraint per OS:

- When moving N instruments to new OS:
  - assign items sequentially starting from 1 (new OS is empty)
  - resequence origin OS items to maintain 1..N order after removal

Recommended approach:

1. Lock involved `InstrumentoOS` rows for the selected instruments
2. Create new OS
3. Move instruments to new OS with sequential item numbers (1, 2, 3, ...)
4. Resequence origin OS items to fill gaps

### 8.3 Proposal/client leakage protection

- New OS is always created with `proposta = origin.proposta`.
- This ensures same proposal and same client automatically.
- No need to validate proposal matching (it's guaranteed by creation).

### 8.4 Concurrency & race conditions

Potential concurrent moves:

- Two managers attempt to move instruments simultaneously

Mitigations:

- use `select_for_update()` for the selected `InstrumentoOS` rows
- optionally lock the destination OS rows too (or use deterministic resequencing at end)

## 9) Edge cases

- Move **one** instrument
- Move **multiple** instruments
- Invalid `tipo_os` provided (not in valid choices)
- Missing `tipo_os` in request
- Origin OS becomes empty after moving all instruments
- Origin OS finalized/cancelled
- Selected instruments include IDs not in origin OS
- Concurrent operations causing item collisions (must be prevented)
- OS number collision (shouldn't happen, but handle gracefully)
- (open) Instruments with downstream calibration results/certificates tied to current OS

## 10) Acceptance criteria

- [ ] User can select 1+ instruments in OS details UI and request movement.
- [ ] Backend can create a new OS with user-selected type and move selected instruments into it.
- [ ] Backend validates that `tipo_os` is provided and is a valid choice.
- [ ] New OS is created with same proposal as origin OS.
- [ ] New OS number is generated correctly based on proposal and type.
- [ ] Operation is fully transactional; no partial moves on failure.
- [ ] Items are resequenced correctly on origin OS after move.
- [ ] Invalid type or missing type is rejected with clear errors.
- [ ] Origin OS status restrictions are enforced (no moves from finalized/cancelled OS).

## 11) Open questions (must be clarified)

1. **Empty origin OS**:
   - Should empty OS be kept, cancelled, or prevented?
   - Should we block moving all instruments (require at least one to remain)?
2. **Status restrictions**:
   - Are moves allowed when origin OS is `EM_ANDAMENTO`? Under which conditions?
3. **Downstream records**:
   - Are moves allowed after certificate generation / calibration results / billing steps?
   - If yes, do we need additional audit/history tracking?
4. **Permissions**:
   - Today `reallocar` requires `gerente`. Should staff also be allowed? Should it be the same as OS update permissions?
5. **OS type restrictions**:
   - Are there any business rules that restrict which types can be chosen? (e.g., can instruments from a CAL OS be moved to a BAL OS?)
   - Should we validate type compatibility based on instrument characteristics?

