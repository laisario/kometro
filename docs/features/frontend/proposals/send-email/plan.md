# Feature: Send Email

## Feature Summary

Form for entering email addresses and sending the proposal PDF to recipients.

## User Value

### Problem Solved
Staff needs to deliver proposals to client contacts efficiently.

### Who Benefits
- **Commercial Managers**: Send proposals quickly
- **Clients**: Receive proposals in email

## Scope

### In Scope
- Email address input
- Multiple recipients
- Send action with feedback

### Out of Scope
- Email templates
- CC/BCC
- Delivery tracking

## User Flow

### Primary Flow
1. Staff views elaborated proposal
2. Staff clicks "Send Email"
3. Dialog opens for email entry
4. Staff enters recipient(s)
5. Staff clicks send
6. Confirmation shown

## Acceptance Criteria

- [ ] Email input field
- [ ] Support multiple emails
- [ ] Send triggers async task
- [ ] Success confirmation shown

## Frontend Behavior

### Screens/Components
- `SendEmailForm.jsx` — Email form dialog

### Key States
- **Open**: Form visible
- **Entering**: Typing emails
- **Sending**: API call
- **Sent**: Success message

## Data & Permissions

### Entities Touched
- `Proposta` — Read (for PDF)

### Permissions
- **Staff Only**: Send emails

## Edge Cases & Failures

### Validation Errors
- Invalid email format: Show error

### Network/Integration Failures
- Send failure: Error message

## Observability

### Logs/Events
- Emails sent logged

## Open Questions

- [ ] Should common emails be saved?

