# Feature: Send Email

## Feature Summary

Sends the proposal PDF to specified email addresses. Uses asynchronous task processing via Celery to handle email delivery without blocking the request.

## User Value

### Problem Solved
After elaborating a proposal, it needs to be sent to the client contacts. This automates the delivery process without manual file attachment.

### Who Benefits
- **Commercial Managers**: Efficiently send proposals to multiple contacts
- **Clients**: Receive proposals directly in email

## Scope

### In Scope
- Send PDF to multiple email addresses
- Async email delivery via Celery
- Use latest revision's PDF

### Out of Scope
- Email tracking/read receipts
- Template customization
- Scheduled sending

## User Flow

### Primary Flow
1. Staff views elaborated proposal
2. Staff enters recipient email addresses
3. Staff clicks "Send"
4. System queues email task
5. System returns success immediately
6. Celery worker sends email asynchronously

### Alternate Flows

#### Email Delivery Failure
- Celery task fails
- Logged for retry/investigation

## Acceptance Criteria

- [ ] Accepts list of email addresses
- [ ] Queues Celery task for each send
- [ ] Returns immediate success response
- [ ] Email includes proposal PDF attachment
- [ ] Only staff can send

## Backend Behavior

### Endpoints
- `POST /propostas/{id}/enviar_email/` — Send proposal email

### Request Body
```json
{
  "emails": ["contact1@client.com", "contact2@client.com"]
}
```

### Response
```json
{
  "message": "Email enviado com sucesso!"
}
```

### Business Rules
- Uses enviar_proposta_cliente_email Celery task
- Task is queued asynchronously (apply_async)
- PDF from latest revision attached
- Email template includes proposal details

### Validations
- Proposal must exist
- User must be admin (staff)
- emails list must be provided

## Data & Permissions

### Entities Touched
- `Proposta` — Read
- `Revisao` — Read (for PDF)

### Permissions
- **Staff Users Only**: Send proposal emails

## Edge Cases & Failures

### Validation Errors
- Invalid email format: Task may fail

### Missing Data
- No PDF available: Task failure

### Permission Denied
- Non-admin sending: Return 403

### Network/Integration Failures
- Email service down: Task queued, fails async
- Celery unavailable: Return 500

## Observability

### Logs/Events
- Email queued: proposal ID, recipients, user
- Task success/failure logged by Celery

### Metrics
- Emails sent per proposal
- Email delivery success rate

## Open Questions

- [ ] Should email content be customizable?
- [ ] Should delivery status be tracked in database?
- [ ] Should CC/BCC be supported?

