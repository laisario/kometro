# Feature: Approve Revision

## Feature Summary

Records an approver's approval or revocation for a document revision. Approvers must be in the revision's approver list and cannot approve their own revisions.

## User Value

### Problem Solved
Document changes require multi-person approval for quality control. This manages the approval workflow.

### Who Benefits
- **Approvers**: Record their review decisions
- **Document Control**: Track approval progress
- **Auditors**: Verify proper approval chain

## Scope

### In Scope
- Create approval record
- Revoke (delete) approval
- Validate approver eligibility
- Prevent self-approval

### Out of Scope
- Approval with comments
- Partial approval
- Rejection workflow

## User Flow

### Primary Flow (Approve)
1. Approver views pending revision
2. Approver reviews changes
3. Approver clicks approve
4. System validates eligibility
5. System creates approval record

### Primary Flow (Revoke)
1. Approver views their approval
2. Approver revokes approval
3. System deletes approval record

## Acceptance Criteria

- [ ] Creates approval for eligible approver
- [ ] Prevents approval by non-approvers
- [ ] Prevents self-approval (revisor cannot approve)
- [ ] Allows approval revocation
- [ ] Returns approval ID on success

## Backend Behavior

### Endpoints
- `POST /documentos/{id}/aprovar/` — Approve/revoke

### Request Body
```json
{
  "revisao_id": 1,
  "delete": false
}
```

### Response (Approve)
```json
{
  "aprovacao_id": 1
}
```

### Response (Revoke)
```json
{
  "deleted": true
}
```

### Business Rules
- Approver must be in revisao.aprovadores M2M
- Revisor cannot approve their own revision
- delete: true removes existing approval
- Creates Aprovacao record with timestamp

### Validations
- User must be in aprovadores list
- User cannot be the revisor
- Revision must exist

## Data & Permissions

### Entities Touched
- `Documento` — Read
- `Revisao` — Read
- `Aprovacao` — Create/Delete

### Permissions
- **Authenticated Users**: Approve if in approver list

## Edge Cases & Failures

### Validation Errors
- Not in approvers: Return 403 with message
- Self-approval attempt: Return 403 with message

### Missing Data
- Revision not found: Return 404

### Permission Denied
- Not an approver: Return 403

## Observability

### Logs/Events
- Approval/revocation: revision ID, user, timestamp

### Metrics
- Approvals per revision
- Time to approval

## Open Questions

- [ ] Should all approvers be required for completion?
- [ ] Should approval trigger document update?

