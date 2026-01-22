# Feature: Create Revision

## Feature Summary

Creates a new document revision indicating either content update (revisar) or validity extension (revalidar). Assigns approvers who must review the changes.

## User Value

### Problem Solved
Documents require periodic review and updates. Revisions create audit trail and manage approval workflow.

### Who Benefits
- **Document Control Specialists**: Initiate document updates
- **Reviewers**: Track what needs approval
- **Auditors**: Review change history

## Scope

### In Scope
- Create revision record
- Assign approvers
- Record change description
- Set revision type

### Out of Scope
- File upload (main document)
- Auto-approval
- Email notification (handled separately)

## User Flow

### Primary Flow
1. User opens document needing review
2. User creates revision
3. User enters change description
4. User selects approvers
5. System creates revision
6. Approvers notified (async)

## Acceptance Criteria

- [ ] Creates revision linked to document
- [ ] Sets revisor to current user
- [ ] Records alteracao (change description)
- [ ] Assigns approvers (M2M)
- [ ] Sets tipo (revisar or revalidar)
- [ ] Returns revision data

## Backend Behavior

### Endpoints
- `POST /documentos/{id}/revisar/` — Create revision

### Request Body
```json
{
  "alteracao": "Updated calibration procedures",
  "tipo": "revisar",
  "aprovadores": [1, 2, 3]
}
```

### Business Rules
- Revisor auto-set to request.user
- tipo: "revisar" or "revalidar"
- Approvers are users who must approve

### Validations
- Document must exist
- Approvers must be valid users
- Tipo must be valid choice

## Data & Permissions

### Entities Touched
- `Documento` — Read
- `Revisao` — Create

### Permissions
- **Authenticated Users**: Create for own client's documents
- **Staff Users**: Create for any

## Edge Cases & Failures

### Validation Errors
- Invalid tipo: Return 400
- Invalid approvers: Return 400

### Missing Data
- Document not found: Return 404

## Observability

### Logs/Events
- Revision created: document ID, revision ID, user

### Metrics
- Revisions per document

## Open Questions

- [ ] Should minimum approvers be enforced?
- [ ] Should revisor be automatically excluded from approvers?

