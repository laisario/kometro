# Feature: Add Instruments

## Feature Summary

Interface for selecting instruments from client inventory to include in a proposal during elaboration.

## User Value

### Problem Solved
Proposals need specific instruments selected from the client's inventory.

### Who Benefits
- **Commercial Managers**: Build accurate proposals

## Scope

### In Scope
- Searchable instrument list
- Multi-select capability
- Price preview
- Add/remove instruments

### Out of Scope
- Instrument creation
- Custom pricing

## User Flow

### Primary Flow
1. Staff opens instrument selector
2. Staff searches for instruments
3. Staff selects instruments
4. Pricing updates automatically
5. Staff confirms selection

## Acceptance Criteria

- [ ] Shows client's instruments
- [ ] Search by tag and type
- [ ] Multi-select with checkboxes
- [ ] Shows price per instrument
- [ ] Updates total on selection

## Frontend Behavior

### Screens/Components
- `FormAddInstrument.jsx` — Selection form
- `VirtualizedInstrumentAutocomplete.jsx` — Searchable list

### Key States
- **Loading**: Fetching instruments
- **Selecting**: Choosing items
- **Selected**: Items shown

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Read

### Permissions
- **Staff Only**: Modify proposal instruments

## Edge Cases & Failures

### Missing Data
- No instruments: Show message

## Observability

### Logs/Events
- Instrument selection changes

## Open Questions

- [ ] Should expired instruments be selectable?

