# Feature: Elaborate Proposal

## Feature Summary

Finalizes a draft proposal by updating its details, changing status to "Awaiting Approval", creating a revision with PDF, and incrementing the client's pending proposals count. This is the primary workflow step that turns a draft into a formal quotation.

## User Value

### Problem Solved
After adding instruments and details to a draft proposal, it needs to be formalized as a PDF document and sent for client approval. This action completes the proposal preparation.

### Who Benefits
- **Commercial Managers**: Finalize and send proposals to clients
- **Clients**: Receive formal proposals for review

## Scope

### In Scope
- Update proposal details
- Change status to "Aguardando Aprovação"
- Create Revisao record
- Generate PDF document
- Increment client's pending proposals counter

### Out of Scope
- Email sending (separate action)
- Client notification
- Approval workflow

## User Flow

### Primary Flow
1. Staff user adds instruments and details to draft
2. User clicks "Elaborate"
3. System validates proposal data
4. System updates status to AA
5. System creates revision record
6. System generates PDF synchronously
7. System increments client pending count
8. User can now send to client

### Alternate Flows

#### Validation Failure
- Missing required data
- Return 400 with errors

## Acceptance Criteria

- [ ] Updates proposal with provided data
- [ ] Changes status from "E" to "AA"
- [ ] Creates Revisao record linked to proposal
- [ ] Generates PDF and attaches to revision
- [ ] Increments cliente.propostas_aguardando_aprovacao
- [ ] Returns success message with 200

## Backend Behavior

### Endpoints
- `PATCH /propostas/{id}/elaborar/` — Elaborate proposal

### Request Body
```json
{
  "condicao_de_pagamento": "30 dias",
  "transporte": "Coleta no cliente",
  "validade": "2025-02-15",
  "dias_uteis": 10,
  "desconto_percentual": 5.00,
  "informacoes_adicionais": "Additional notes"
}
```

### Business Rules
- Uses atomic transaction
- Status changes E → AA
- Creates Revisao with auto-incremented rev number
- Generates PDF synchronously via gerar_pdf_proposta task
- PDF includes total_com_desconto from serializer

### Validations
- Proposal must exist
- Serializer validates all fields
- User must be admin (staff)

## Data & Permissions

### Entities Touched
- `Proposta` — Update
- `Revisao` — Create
- `Cliente` — Update (pending count)

### Permissions
- **Staff Users Only**: Elaborate proposals

## Edge Cases & Failures

### Validation Errors
- Invalid data: Return 400 with serializer errors

### Missing Data
- Proposal not found: Return 404

### Permission Denied
- Non-admin attempting: Return 403

### Network/Integration Failures
- PDF generation failure: Transaction rolled back
- Database error: Return 500

## Observability

### Logs/Events
- Elaboration: proposal ID, user, revision number
- PDF generation timing

### Metrics
- Proposals elaborated per day
- PDF generation time

## Open Questions

- [ ] Should elaboration be reversible (back to draft)?
- [ ] Should partial data be saveable without elaboration?

