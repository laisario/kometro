# Feature: Proposal Total from Item Prices (Frontend)

## Feature Summary

Align the frontend with the new backend model where the proposal total is the sum of per-item prices stored on `PropostaInstrumento`. Show and allow editing of the unit price per instrument in the elaboration flow; pre-fill price from item local (and alternative price when present); keep total and discount calculation in sync with the backend and avoid duplicate or conflicting logic.

## User Value

### Current Behavior (Being Replaced)

- **FormElaborate**: Total is computed in the frontend with `data?.instrumentos?.reduce(...)` using a single **proposal-level** `local` from the form (`form.watch("local")`). For each instrument, `getValue(item)` returns: `item.precoAlternativoCalibracao` if set, else `item.instrumento.precoCalibracaoNoCliente` or `precoCalibracaoNoLaboratorio` depending on that single `local`. So:
  - All instruments are priced with the same rule (one local for the whole proposal).
  - The list used is `data.instrumentos` (M2M list from API), not per-item selections.
- **InstrumentServiceSelectionTable**: Shows per-instrument `local` and `service_kind` but has **no price column** and does not participate in the total shown in FormElaborate.
- **Discount**: User enters a percentage; total with discount is computed locally (e.g. `total * (1 - desconto/100)`) and displayed. The value sent on elaborate is part of the form payload; the backend recalculates total when it has instrumentos, so there can be a mismatch if backend and frontend use different bases (e.g. backend using proposal local vs frontend using form local).
- **Data source**: Proposal detail returns `instrumentos` (list of InstrumentoDoCliente) and `instrumentos_selecoes` (list of PropostaInstrumento). The current total uses `instrumentos` + form `local`; it does not use `instrumentos_selecoes` or any stored per-item price.

### Problem with Current Approach

1. Per-item `local` is editable in the UI (InstrumentServiceSelectionTable) but the total ignores it and uses the form-level local.
2. User cannot override the price of a single instrument; price is always derived from catalog/alternative.
3. If backend moves to total = sum(item prices), the frontend must show and edit those prices and send them so that the displayed total matches the backend and PDF.

### Objective of the New Solution

- **Display and edit price per item**: In the elaboration (and wherever proposal items are shown for editing), each row has an editable unit price. The list to use is the one that carries the stored price: effectively the items from the API that include `instrumentos_selecoes` (with `preco`) or a merged view of instrument + selection + preco.
- **Pre-fill price**: When an item is added or when its `local` changes, pre-fill the price field with: (1) preço alternativo do instrumento do cliente, if set; (2) otherwise preço calibração no cliente ou no laboratório according to **that item’s** `local`. This value remains editable.
- **Total in UI**: Total = sum of per-item prices (the same values that will be sent to the backend). So the frontend either uses the same list that has `preco` (e.g. instrumentos_selecoes with preco) or a derived list that includes preco per instrument.
- **Discount**: Keep current UX (user enters percentage); total with discount = total * (1 - desconto/100). The backend remains the source of truth for persisted total and total_com_desconto; the frontend should send item prices (and optionally total/total_com_desconto for validation) so that after save, refetched data matches what the user saw.
- **Single source of truth**: Avoid computing total from catalog in the frontend when the backend will use stored `PropostaInstrumento.preco`. Prefer: display and edit the same `preco` values that the backend uses for the sum.

### Who Benefits

- **Commercial team**: See and adjust each line’s price; total updates as they edit; discount applies to the same base as the backend.
- **Consistency**: No mismatch between “total in form” and “total after save” when both use item prices.

## Scope

### In Scope

- In the elaboration flow (and any other place where proposal items are edited), show a **price per instrument** (from `instrumentos_selecoes[].preco` or equivalent).
- Allow editing that price (input/field per row).
- When loading the form or when adding an item / changing an item’s local, **pre-fill** the price using: alternative price if present, else catalog price by that item’s local (cliente vs laboratorio).
- Compute and display **total** = sum of per-item prices; update in real time as the user edits prices or adds/removes items.
- Keep **discount** UX: user enters percentage; display total with discount = total * (1 - percent/100).
- Send in the payload for create/update/elaborate the list of items with `preco` (and id, local, service_kind as today) so the backend can persist and recompute total.
- When the backend returns updated proposal (e.g. after elaborate), refetch or use response so that the UI shows the same total and total_com_desconto as the backend (no conflicting client-side formula).

### Out of Scope

- Changing how instruments are added/removed (add_instrumento, etc.); only extend payload with `preco` where applicable.
- Multi-currency or per-item discount in the UI.
- Changing PDF preview/download flow; it will use backend-generated PDF with the new total.

## Business Rules (Frontend)

- **Source of item list for total**: Use the list that includes per-item price. That is the list that comes from the API as `instrumentos_selecoes` (each element with `instrumento_id`, `local`, `service_kind`, `preco`) or a merged structure that joins `instrumentos` with `instrumentos_selecoes` so each row has instrument info + preco. FormElaborate (and any table that shows total) must use this list, not only `instrumentos` + form-level local.
- **Pre-fill rule**: For each item, suggested price = (1) instrument’s preço alternativo if set, (2) else instrument’s preço calibração no cliente or no laboratório by **that item’s** local. When the user changes the item’s local, the suggested price can be updated in the UI (and optionally sent to the backend if backend supports re-suggest); the user can still override.
- **Editable**: The price field is always editable; the user can override the pre-filled value.
- **Total**: Total = sum of (per-item price). If an item has no price yet, treat as 0 or use suggested value for display until saved.
- **Discount**: total_com_desconto_display = total * (1 - desconto_percentual/100). Display this; on submit, send item list with preco and desconto_percentual so the backend can persist and return the same numbers.
- **Trust**: After save, the displayed total and total_com_desconto should come from the API response (or refetch). Do not keep a separate “client-only” total that diverges from the backend.

## Frontend Behavior

### Screens/Components Impacted

- **FormElaborate.jsx**:
  - Stop using `data.instrumentos` + single `local` for total.
  - Use the list that has per-item price (e.g. merge `data.instrumentos_selecoes` with instrument data, or use a structure that includes `preco` per item).
  - Add a price field per item (or use a table that includes price). On change, update local state and recompute total.
  - When initializing or when an item’s local changes, set that item’s price to the suggested value (alternative or catalog by local) if the user has not already set a custom value (optional: track “dirty” per item).
  - Total = sum of item prices; discount = total * (1 - percent/100). Send in payload: instrumentos (or instrumentos_selecoes) with `preco` per item, plus other fields (desconto_percentual, etc.).
- **InstrumentServiceSelectionTable.jsx** (or equivalent):
  - Add a **Preço** column. Bind to the same per-item price that is used in the total. Allow edit; on change, update parent state and recalc total.
  - When local changes, optionally update the suggested price in the cell (or just update suggestion for new items; product decision).
- **Assets.jsx / CardInformation**: If the proposal detail view shows instrument list, consider showing per-item price when available (from instrumentos_selecoes). Not mandatory for first version if the main edit flow is FormElaborate + table.
- **Proposal details / InformationProposal or ProposalDetailsPreview**: They already show total and total_com_desconto from API; no change in formula, only ensure they display the values returned by the backend after the new total is implemented.

### Data Shape and API Contract

- **Response**: Proposal detail must return per-item price. Backend plan exposes `preco` on each element of `instrumentos_selecoes`. Frontend can use `data.instrumentos_selecoes` and, if needed, join with `data.instrumentos` by instrument id to get instrument info (tag, catalog prices, etc.).
- **Payload (create/update/elaborate)**: Send list of items with at least: id (instrument or selection id as required by API), local, service_kind, **preco**. Format must match what the backend expects (e.g. instrumentos as list of objects with preco, or instrumentos_selecoes update). See backend plan for exact field names (snake_case: preco).

### State and Validation

- **State**: Hold the list of items with preco (and local, service_kind) in form state or parent state so that total = sum(preco) and the table can bind to it. When the user edits a price, update that item’s preco and recompute total.
- **Validation**: Optionally validate preco >= 0 and numeric; allow empty only if backend accepts null and treats as 0 in sum. If backend requires a value, frontend should pre-fill suggested value so the user can submit without filling every row.
- **Sync with backend**: After a successful elaborate or update, invalidate/refetch proposal so that the next time the form opens it shows backend’s total and item prices. Do not rely on a client-only total that is never sent or persisted.

### Behavior When Local Changes

- If the user changes an item’s **local** in the table:
  - Option A: Only update the suggested price in the UI (e.g. in a “suggested” or placeholder), but do not overwrite the user’s current price if they already edited it.
  - Option B: Auto-fill that item’s price with the new suggested value (alternative or catalog by new local), and allow the user to change it again.
  - Recommendation: Option A to avoid surprising overwrites; document the choice.
- Total must be recalculated after any price or list change.

### Behavior When Alternative Price Exists

- When loading or when building the suggested price for an item, if the instrument has preço alternativo, use it as the suggested value regardless of local. The backend will do the same for initial/suggested value.

## Dependencies

- **Backend**: Must expose `preco` in read responses (instrumentos_selecoes) and accept `preco` in create/update/elaborate payloads; must recompute total from item prices so that the value shown after save matches the frontend sum.
- **API contract**: Align with backend on payload shape (e.g. instrumentos: [{ id, local, service_kind, preco }] or equivalent).

## Implementation Plan (Frontend)

1. **Data layer**: Ensure proposal detail query returns and caches `instrumentos_selecoes` with `preco`. Use this (merged with instrument info if needed) as the list for the elaboration form.
2. **FormElaborate**: Switch total calculation from `data.instrumentos` + form `local` to the sum of per-item `preco` from the items list (instrumentos_selecoes or merged).
3. **Table with price column**: Add a price input/column to the instrument table used in elaboration. Bind to the same item list; on change, update preco and recompute total. Pre-fill new or missing prices with suggested value (alternative or catalog by item local).
4. **Payload**: Include `preco` for each item in the payload for elaborate (and create/update when instrument list is sent). Use the same field name as backend (e.g. `preco` in snake_case if API expects it).
5. **Discount**: Keep current discount UI; ensure the total used for “total com desconto” is the same sum-of-items total. After save, refresh data so displayed total matches backend.
6. **Edge cases**: Empty list (total 0); new item without preco (use suggested value before submit or send null if backend accepts); instrument without catalog price (suggested 0 or null, user must fill).

## Acceptance Criteria

- [ ] Each proposal item has an editable unit price in the elaboration flow (and wherever item list is edited).
- [ ] Price is pre-filled with: alternative price if present, else catalog price by that item’s local.
- [ ] Total displayed = sum of per-item prices; updates when user edits prices or adds/removes items.
- [ ] Discount percentage applies to that total; total com desconto displayed correctly.
- [ ] Payload for elaborate (and create/update with instruments) includes preco per item.
- [ ] After save, refetched data shows the same total and total_com_desconto as the backend (no persistent mismatch).
- [ ] Changing an item’s local does not force-overwrite an already edited price (or document the chosen behavior).

## Observability

- Log or track (if needed) when total is recalculated or when user edits a price; no strict requirement unless product asks.

## Relation to Existing Documentation

- **docs/features/frontend/proposals/elaborate-proposal/plan.md**: Continues to describe the multi-step form, instrument selection, terms, PDF. The acceptance criterion “Price calculation based on location” is **superseded** by this feature: price is now per item (from `preco`), with pre-fill from location and alternative price, and total = sum of item prices. “System calculates total” should be read as “total = sum of item prices; user can edit each item’s price.”
- **Obsolete**: The current FormElaborate logic that computes total from `data.instrumentos` and a single form `local` (getValue + reduce) must be replaced by the sum of per-item `preco` and by sending `preco` in the payload.

## Open Questions

- [ ] Should the instrument list in FormElaborate be the same table as InstrumentServiceSelectionTable (with price column added), or a separate table that shows instrument + preco?
- [ ] On “add instrument”, should the new row get a pre-filled price from backend (e.g. from adicionar_instrumento response) or only from frontend suggestion?
- [ ] Should we show “suggested price” vs “custom price” (e.g. badge or style) when the user overrides?
