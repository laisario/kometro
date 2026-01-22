# Feature: Register Flow

## Feature Summary

Multi-step registration wizard for new organizations: company info, address, and user credentials.

## User Value

### Problem Solved
New organizations need self-service onboarding.

### Who Benefits
- **New Organizations**: Easy setup
- **Sales Team**: Automated onboarding

## Scope

### In Scope
- Step 1: Company information
- Step 2: Address
- Step 3: User credentials
- Progress indicator
- Validation per step

### Out of Scope
- Email verification
- Payment

## User Flow

### Primary Flow
1. User starts registration
2. Step 1: Enter company info (CNPJ, name)
3. Step 2: Enter address
4. Step 3: Create user credentials
5. Registration complete, redirect to login

## Acceptance Criteria

- [ ] Three-step wizard
- [ ] Progress indicator
- [ ] Validation at each step
- [ ] CNPJ format validation
- [ ] Creates all records on completion

## Frontend Behavior

### Screens/Components
- `RegisterBasicsPage.jsx` — Step 1
- `RegisterLocationPage.jsx` — Step 2
- `RegisterAuthPage.jsx` — Step 3

### Key States
- **Step 1-3**: Current step active
- **Validating**: Checking data
- **Complete**: Success message

## Data & Permissions

### Entities Touched
- Registration APIs

### Permissions
- **Public**: Registration flow

## Edge Cases & Failures

### Validation Errors
- Invalid CNPJ: Show error
- Duplicate email: Show error

## Observability

### Logs/Events
- Registration progress

## Open Questions

- [ ] Should partial registration be saved?

