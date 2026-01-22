# Feature: Client Details

## Feature Summary

Staff view of complete client information with instruments and calibration management capabilities.

## User Value

### Problem Solved
Staff needs comprehensive client view for service delivery.

### Who Benefits
- **Staff**: Manage client accounts
- **Lab Technicians**: Access client instruments

## Scope

### In Scope
- Client information display
- Instrument list/management
- Calibration panel
- Contact information

### Out of Scope
- Billing information
- Contract management

## User Flow

### Primary Flow
1. Staff clicks client from list
2. System loads client details
3. Staff views information
4. Staff can manage instruments/calibrations

## Acceptance Criteria

- [ ] Shows company information
- [ ] Shows contact/address
- [ ] Lists client instruments
- [ ] Calibration panel available
- [ ] Edit capabilities

## Frontend Behavior

### Screens/Components
- `ClientDetailsPage.jsx` — Main page
- `ClientInformation.jsx` — Info cards
- `ClientInstrumentInformation.jsx` — Instruments

### Key States
- **Loading**: Skeleton
- **Loaded**: Full display
- **Editing**: Edit mode

## Data & Permissions

### Entities Touched
- `Cliente` — Read
- `InstrumentoDoCliente` — Read

### Permissions
- **Staff Only**: Access page

## Edge Cases & Failures

### Missing Data
- Client not found: 404

## Observability

### Logs/Events
- Client detail views

## Open Questions

- [ ] Should there be activity timeline?

