# Feature: Create Proposal

## Feature Summary

Creates a new commercial proposal for a client. Proposals start in "Draft" status and can have instruments added to them. Auto-generates a unique proposal number based on a sequential pattern.

## User Value

### Problem Solved
Commercial teams need to create formal quotations for calibration services. The system automates number generation and initial setup.

### Who Benefits
- **Commercial Managers**: Initiate new proposals quickly
- **Administrators**: Track proposal creation

## Scope

### In Scope
- Create proposal with client association
- Auto-generate unique proposal number
- Set initial status to "Elaboração" (Draft)
- Associate instruments (optional at creation)

### Out of Scope
- PDF generation (separate elaborate step)
- Pricing calculation at creation
- Multi-client proposals

## User Flow

### Primary Flow
1. Staff user selects client
2. User initiates new proposal
3. System generates proposal number
4. System creates proposal in draft status
5. User adds instruments separately

### Alternate Flows

#### From Client Context
- Proposal created while viewing client details
- Client pre-selected

## Acceptance Criteria

- [ ] Creates proposal with generated numero
- [ ] Associates with specified client
- [ ] Sets status to "E" (Elaboração)
- [ ] Returns created proposal with 201 status
- [ ] Numero follows pattern NNNNMYY (sequence + month + year)

## Backend Behavior

### Endpoints
- `POST /propostas/` — Create proposal

### Request Body
```json
{
  "cliente": 1,
  "local": "P",
  "informacoes_adicionais": "Notes here"
}
```

### Number Generation (generate_numero)
Format: `NNNNMYY`
- NNNN: 4-digit sequence (padded)
- M: Month letter (A=Jan, B=Feb... L=Dec)
- YY: 2-digit year

Example: `0015A26` = 15th proposal, January 2026

### Business Rules
- Numero is unique (enforced by constraint)
- Status defaults to "E" (Elaboração)
- data_criacao set to current timestamp

### Validations
- `cliente` — Required, must exist
- `local` — Optional, defaults to "P"

## Data & Permissions

### Entities Touched
- `Proposta` — Create

### Permissions
- **Staff Users Only**: Create proposals

## Edge Cases & Failures

### Validation Errors
- Invalid client: Return 400

### Missing Data
- Client not found: Return 400

### Permission Denied
- Non-staff creating proposal: Return 403

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- Proposal created: numero, client ID, user

### Metrics
- Proposals created per day/user

## Open Questions

- [ ] Should non-staff be able to request proposals?

