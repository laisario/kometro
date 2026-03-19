# Feature: Proposal Total from Item Prices (PropostaInstrumento.preco)

## Feature Summary

Replace the current proposal total calculation (based on proposal-level `local` and instrument catalog prices) with a model where the total is the sum of a **per-item price** stored on `PropostaInstrumento`. Add a new field `preco` on `PropostaInstrumento` as the source of truth for each item's value; support pre-fill from instrument prices (with priority for alternative price) and allow manual override. Revisit discount logic so it applies consistently to this new total.

---

## Fix: Proposal Elaboration Flow (2025-03)

### Problem Statement (Current Broken Behavior)

1. **Local changes not reflected in PDF**: When the team changes `local` per instrument during elaboration, the PDF still uses `proposta.local` (proposal-level) for all instruments. Per-item `PropostaInstrumento.local` is persisted but the PDF template ignores it.
2. **Total depends on frontend-sent prices**: When `preco` is null, the backend uses `Decimal("0")` instead of resolving from alternative/catalog. If the frontend omits prices, the total is wrong.
3. **Alternative price not visible**: The elaboration form does not show the client's alternative price (`preco_alternativo_calibracao`), so the team cannot make informed decisions.
4. **Backend not source of truth**: Total calculation can diverge when frontend sends incomplete data.

### Expected Behavior After Fix

- **Backend is source of truth** for total calculation.
- **Per-item `local`** edited during elaboration is persisted on `PropostaInstrumento` and used everywhere (including PDF).
- **Price resolution** when `preco` is null: use alternative price if set, else catalog by item's `local` (P→laboratorio, C→cliente, T→no automatic value).
- **PDF** uses `instrumentos_selecoes` (PropostaInstrumento) with per-item local and resolved price.
- **Frontend** displays alternative price clearly for each instrument.

### Final Price Precedence Rules

1. **Manual `preco`** on `PropostaInstrumento` (if filled) → use it.
2. **Alternative price** (`InstrumentoDoCliente.preco_alternativo_calibracao`) if set → use it (for P and C).
3. **Catalog by local**:
   - `local == "P"` (Instalações Permanentes) → `Instrumento.preco_calibracao_no_laboratorio`
   - `local == "C"` (Cliente) → `Instrumento.preco_calibracao_no_cliente`
   - `local == "T"` (Terceirizado) → no catalog price; user must enter manually (fallback: 0).
4. **If no valid value**: use 0 (explicit, safe).

### Persistence Rules

- `local`, `service_kind`, `preco` are persisted on `PropostaInstrumento` when elaboration form is saved.
- When `preco` is null in payload, backend resolves and persists the suggested value (alternative → catalog by local → 0).

### PDF Impact

- PDF receives `instrumentos_selecoes` (PropostaInstrumento) instead of `instrumentos` (InstrumentoDoCliente).
- For each row: show `pi.local`, resolved unit price (from `pi.preco` or fallback).
- Total comes from `total_com_desconto` (unchanged).

### Edge Cases

- Terceirizado (T): no catalog; if no manual price, use 0.
- Missing catalog prices: use 0.
- Empty instrument list: total = 0.

### Test Plan

1. Client creates proposal with one `local`, team changes it during elaboration, save succeeds, PDF reflects the new value.
2. Manual `preco` filled → total uses manual price.
3. Manual `preco` empty + local = `instalacoes_permanentes` (P) → uses `preco_calibracao_no_laboratorio`.
4. Manual `preco` empty + local = `cliente` (C) → uses `preco_calibracao_no_cliente`.
5. Alternative price visibility appears in frontend.
6. Backend calculates correct total even when frontend sends incomplete price data (preco: null).
7. Editing existing proposal does not regress previous behavior.
8. Multi-instrument proposal total is aggregated correctly.
9. Missing fallback prices are handled explicitly (use 0).
10. PDF uses persisted final values from `instrumentos_selecoes`.

## User Value

### Current Behavior (Being Replaced)

- **Backend**: The total of the proposal (`Proposta.total`) is recalculated only in `PropostaAdminSerializer.update()`. The formula uses:
  - The proposal-level field `Proposta.local` (P, C or T) to choose the price field for **all** instruments.
  - For each instrument in the M2M `Proposta.instrumentos` (InstrumentoDoCliente):  
    - If `InstrumentoDoCliente.preco_alternativo_calibracao` is set, that value is used.  
    - Otherwise, `Instrumento.preco_calibracao_no_cliente` or `Instrumento.preco_calibracao_no_laboratorio` is used according to `Proposta.local` (C → cliente, else laboratorio).
  - So: **one local for the whole proposal** drives the price source; there is no per-instrument price stored on the proposal.
- **Inconsistency**: The model already has `PropostaInstrumento` with a **per-instrument** `local` (and `service_kind`), but this per-item `local` is **not used** in the total calculation. The total is based on `Proposta.instrumentos` + `Proposta.local` only. So we have per-item local stored but not used for pricing.
- **When total is recalculated**: Only when an admin updates the proposal (or elaborates) **and** the payload includes `instrumentos`. If the request does not send `instrumentos`, the existing total is left unchanged.
- **Discount**: `total_com_desconto` is computed in serializers as `proposta.total * (1 - desconto_percentual/100)`. The source of truth for the base is `Proposta.total`.

### Problem with Current Approach

1. **Per-instrument local is ignored for pricing**: Each item can have a different `local` in `PropostaInstrumento`, but the total uses a single `Proposta.local`. So the total does not reflect “this item at client, that item at lab”.
2. **No editable price per item**: The commercial team cannot override the price of a single instrument in a proposal; the value is always derived from catalog/alternative price and proposal-level local.
3. **Fragile when catalog is incomplete**: If `preco_calibracao_no_cliente` or `preco_calibracao_no_laboratorio` is null on `Instrumento`, the aggregate can produce null/incorrect totals. There is no proposal-specific override.
4. **Two sources of “selections”**: The system has both the M2M `instrumentos` and the table `PropostaInstrumento` (instrumentos_selecoes). Total is tied to the M2M + proposal local, not to the per-item selections.

### Objective of the New Solution

- **Single source of truth for item value**: Each line of the proposal has a stored price: `PropostaInstrumento.preco`.
- **Total**: `Proposta.total` = sum of `PropostaInstrumento.preco` for all items of that proposal.
- **Initial value for `preco`**: When an item is added or when local/service is set, the backend (and frontend) can suggest a value using: (1) `InstrumentoDoCliente.preco_alternativo_calibracao` if set; (2) otherwise `Instrumento.preco_calibracao_no_cliente` or `Instrumento.preco_calibracao_no_laboratorio` according to **that item’s** `PropostaInstrumento.local`. This suggestion can be overwritten by the user.
- **Discount**: Continue to apply `desconto_percentual` on top of `Proposta.total`; no change in formula, only in how `Proposta.total` is produced (sum of item prices instead of aggregate from catalog).

### Who Benefits

- **Commercial team**: Set or adjust price per instrument per proposal; total reflects per-item choices and overrides.
- **Operations**: Fewer surprises when catalog prices are missing; proposal-level override per item.

## Scope

### In Scope

- Add `preco` to `PropostaInstrumento` and make it the basis for proposal total.
- Define rules for initial/suggested value of `preco` (alternative price priority, then local-based catalog price).
- Recalculate `Proposta.total` as the sum of `PropostaInstrumento.preco` (or equivalent) wherever the proposal or its items are saved/updated.
- Accept and persist `preco` (and if needed, (re)compute suggested values) in create/update/elaborate flows.
- Expose `preco` in read serializers and in payloads for create/update so the frontend can show and edit it.
- Revisit discount logic so it clearly applies to the new total; document any edge cases (e.g. total 0, null).
- Migration and backfill strategy for existing `PropostaInstrumento` rows without `preco` (e.g. from current catalog/local rules).
- Centralize calculation in one place (service or model) to avoid duplicated logic.

### Out of Scope

- Changing how `Instrumento` or `InstrumentoDoCliente` store catalog/alternative prices.
- Multi-currency or per-item discount (only proposal-level discount percent).
- Changing PDF generation logic beyond using the same `Proposta.total` / `total_com_desconto` as today (values will just come from the new calculation).

## Business Rules

### New Field: `PropostaInstrumento.preco`

- **Type**: `DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)` (or equivalent). Null/blank allowed for legacy rows until backfilled; new flows should set it.
- **Semantics**: Unit price for this instrument in this proposal. This is the value used in the sum that yields `Proposta.total`.
- **Priority for suggested/initial value** (when creating or when local changes, if backend or frontend suggests a value):
  1. For local "T" (Terceirizado): no automatic catalog price; suggested value is null or 0; user must fill manually.
  2. For local "P" or "C": If `InstrumentoDoCliente.preco_alternativo_calibracao` is set, use it.
  3. Else, use `Instrumento.preco_calibracao_no_cliente` or `Instrumento.preco_calibracao_no_laboratorio` (C → cliente, P → laboratorio).
  4. If both are null, suggested value can be 0 or null; the user must be able to edit.
- **Override**: The user can always edit `preco` manually. When the user changes only `local` on an item, the backend auto-updates `preco` to the new suggested value (see Resolved Decisions). For "T" (Terceirizado), no auto-fill; user must enter the price.

### Total and Discount

- **Proposta.total** = sum of `PropostaInstrumento.preco` for all items linked to that proposal (via `instrumentos_selecoes`). If there are no items, total = 0 (or null, consistently with current behavior).
- **total_com_desconto** = `Proposta.total * (1 - desconto_percentual/100)`, unchanged. All serializers that today compute `total_com_desconto` from `proposta.total` continue to do so; only the way `proposta.total` is set changes.
- **When to recompute `Proposta.total`**: Whenever proposal items or their `preco` change (create/update of proposal with instrumentos, update of instrumentos_selecoes, or dedicated endpoint that updates item prices). Recompute in a single place (e.g. service or model method) and call it from all relevant write paths.

### Backward Compatibility and Migration

- Existing `PropostaInstrumento` rows may not have `preco`. Options:
  - **Backfill migration**: For each row, set `preco` = suggested value (alternative price if present, else catalog by item’s `local`). Then all reads/writes use `preco`.
  - **Runtime fallback**: If `preco` is null, compute suggested value from catalog/local for that item and use it only for the sum (do not persist). Prefer backfill so that the model is the single source of truth and logic is simpler.
- Proposals that have no `PropostaInstrumento` but still have the M2M `instrumentos` populated: migration or a one-time sync should create or align `PropostaInstrumento` and set `preco` so that total is consistent. Document the chosen strategy.

## Backend Behavior

### Model Changes

- **PropostaInstrumento**:
  - Add `preco = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Preço", help_text="Preço unitário deste item na proposta. Usado no cálculo do total.")
  - Migration: add field; then data migration to backfill `preco` from current rule (per-item local + alternative/catalog).

### Where Total Calculation Should Live

- **Recommended**: A small domain layer, e.g. `propostas.services` or a method on `Proposta`:
  - `recompute_total(proposta)` or `Proposta.recompute_total()`:  
    - Sum `proposta.instrumentos_selecoes.values_list('preco', flat=True)` (or aggregate), treating null as 0 if needed.  
    - Set `proposta.total` and `proposta.save(update_fields=['total'])`.
  - Call this after any change that affects item list or item prices: create/update proposal with instrumentos, update of instrumentos_selecoes (including preco), and any PATCH that updates item prices.
- **Avoid**: Duplicating the sum logic in multiple serializers or views. One function, one place.

### Serializers

- **PropostaInstrumentoSerializer**:
  - Add `preco` to `fields` (read and write).
  - In create/update of parent proposal, when creating/updating `PropostaInstrumento`, persist `preco` from payload. If `preco` is not sent but `local` is, set initial `preco` from suggested value (alternative then catalog by local) so that backfill is not the only path.
- **InstrumentosField** (if still used for bulk instrument list):
  - Extend normalized structure to accept optional `preco` per item: `[{"id": 1, "service_kind": "...", "local": "P", "preco": "100.00"}, ...]`. When creating/updating `PropostaInstrumento`, use provided `preco` or compute suggested value.
- **Read serializers** (ReadPropostaSerializer, ReadPropostaAdminSerializer):
  - Already expose `instrumentos_selecoes`; ensure each item includes `preco` so the frontend can show and send it back.
- **PropostaAdminSerializer.update()**:
  - Remove the current block that recalculates total from `instance.instrumentos.aggregate(...)` and `instance.local`. Replace with a call to the central `recompute_total(instance)` (or equivalent) after applying instrumentos/instrumentos_selecoes updates. Ensure instrumentos_selecoes are updated with the new `preco` when present in the payload.
- **get_total_com_desconto**:
  - No change in formula; it already uses `proposta.total`. After total is recomputed from items, discount continues to apply to that total.

### Endpoints Impacted

- **POST /propostas/** (create): When instrumentos (with optional preco) are sent, create `PropostaInstrumento` with `preco` (or suggested value), then set `Proposta.total` via central recompute.
- **PATCH /propostas/{id}/** (update/admin): When instrumentos or instrumentos_selecoes are updated (including preco), persist preco per item and call recompute_total.
- **PATCH /propostas/{id}/elaborar/** (elaborate): Uses same admin serializer; if payload includes instrumentos with preco, same behavior as update. After save, `total_com_desconto` returned and used for PDF must come from the new total.
- **POST /propostas/{id}/adicionar_instrumento/**: Adds instruments and creates `PropostaInstrumento`. Must set initial `preco` (suggested from alternative/catalog by item local) and then recompute proposal total.

### Suggested Value Helper

- Implement a function that, given a `PropostaInstrumento` (or instrumento_id + local), returns the suggested price:  
  - `InstrumentoDoCliente.preco_alternativo_calibracao` if set,  
  - else `Instrumento.preco_calibracao_no_cliente` or `preco_calibracao_no_laboratorio` by local.  
- Use this when creating/updating items without an explicit `preco` and in the backfill migration.

## Data Migration and Backfill

- **Migration 1**: Add `PropostaInstrumento.preco` (nullable).
- **Migration 2 (data)**: For each `PropostaInstrumento` where `preco` is null, set `preco` = suggested value (alternative price if present, else catalog by that row’s `local`). If catalog is null, use 0 or leave null and document.
- **Proposals with M2M but no PropostaInstrumento**: If there are proposals with `instrumentos` set but no corresponding `instrumentos_selecoes`, decide: either create `PropostaInstrumento` rows from the M2M and backfill preco from `Proposta.local` (old behavior), or leave as-is and handle in code with a fallback. Prefer creating rows so the model is consistent.

## Inconsistencies Documented (Current State)

- **Per-item local unused for total**: `PropostaInstrumento.local` exists but total uses `Proposta.local`. New design uses per-item local for suggestion and uses `PropostaInstrumento.preco` for total.
- **Total only on update with instrumentos**: If the client does not send `instrumentos` in PATCH, total is not recalculated. New design should recompute total whenever instrumentos_selecoes or their preco change, including when only preco is updated (if such an endpoint exists).

## Acceptance Criteria

- [ ] `PropostaInstrumento` has a `preco` field; migration and backfill applied.
- [ ] Total is computed only from the sum of `PropostaInstrumento.preco` (single implementation, no duplicate logic).
- [ ] Suggested value for `preco` follows: alternative price first, then catalog by item’s local.
- [ ] Create/update/elaborate and add_instrumento persist `preco` and recompute `Proposta.total`.
- [ ] Read serializers expose `preco` per item.
- [ ] Discount logic unchanged in formula; applies to the new total.
- [ ] Old behavior (total from proposal local + M2M aggregate) removed from code and replaced by the new flow.
- [ ] Proposals without items have total 0 (or null by convention); no errors.

## Dependencies

- Frontend will send and display `preco` per item; backend must accept and return it and recompute total so that PDF and APIs show the same value.
- Elaborate and PDF already use `total_com_desconto` from serializer; no API contract change, only the way `proposta.total` is set.

## Relation to Existing Documentation

- **docs/features/backend/propostas/elaborate-proposal/plan.md**: Continues to describe status change, revision, PDF and client counter. The sentence “PDF includes total_com_desconto from serializer” remains valid; only the **origin** of `proposta.total` (and thus `total_com_desconto`) changes: it becomes the sum of `PropostaInstrumento.preco` instead of the aggregate from `Proposta.instrumentos` + `Proposta.local`.
- **Obsolete**: The logic described in this plan replaces the total recalculation block in `PropostaAdminSerializer.update()` that uses `instance.instrumentos.aggregate(...)` and `instance.local`. That block must be removed and replaced by the central recompute from item prices.
- **docs/features/backend/propostas/add-instruments/plan.md**: “Automatic pricing calculation” is listed as Out of Scope there; with this feature, add_instrumento (and any flow that creates `PropostaInstrumento`) must set initial `preco` and trigger total recompute, so pricing becomes in scope for that flow.

## Resolved Decisions

- **When user changes only `local` on an item**: Backend **auto-updates** `preco` to the new suggested value (alternative price if present, else catalog price by the new local). This keeps the price in sync with the item's location. 
- **Re-sync endpoint**: **No** endpoint to bulk reset all item prices from catalog. Prices are set at creation/update and when local changes.
- **For "T" (Terceirizado)**: No automatic catalog price; the value will be **filled manually** by the user. The suggested-value logic applies only to "P" and "C"; for "T", `preco` starts null or 0 and must be entered by the user.
