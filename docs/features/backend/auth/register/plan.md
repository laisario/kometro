# Feature: Register

## Feature Summary

Multi-step registration process for new organizations. Creates company (Empresa), client (Cliente), and user records through three sequential API calls.

## User Value

### Problem Solved
New organizations need to self-register and set up their accounts to use the system.

### Who Benefits
- **New Organizations**: Self-service onboarding
- **Sales Team**: Automated client setup

## Scope

### In Scope
- Step 1: Company information (Empresa)
- Step 2: Address information (Endereco)
- Step 3: User credentials

### Out of Scope
- Email verification
- Admin approval
- Payment integration

## User Flow

### Primary Flow
1. User enters company info (Step 1)
2. System creates Empresa and Cliente
3. User enters address (Step 2)
4. System creates/updates address
5. User enters credentials (Step 3)
6. System creates user
7. Registration complete

### Alternate Flows

#### Duplicate CNPJ
- Return validation error

## Acceptance Criteria

- [ ] Step 1 creates Empresa and Cliente, returns client ID
- [ ] Step 2 creates address linked to client
- [ ] Step 3 creates user linked to client
- [ ] All steps publicly accessible
- [ ] Validation at each step

## Backend Behavior

### Endpoints
- `POST /register/basics/` — Step 1: Company
- `POST /register/location/` — Step 2: Address
- `POST /register/auth/` — Step 3: User

### Step 1 Request
```json
{
  "razao_social": "Company Name",
  "cnpj": "12.345.678/0001-90",
  "nome_fantasia": "Brand Name"
}
```

### Step 1 Response
Returns created client ID for use in subsequent steps.

### Business Rules
- Steps can be called independently
- Client ID passed between steps
- Default group assigned to user
- User associated with client

### Validations
- CNPJ format and uniqueness
- Required fields per step
- Email uniqueness (Step 3)

## Data & Permissions

### Entities Touched
- `Empresa` — Create
- `Cliente` — Create
- `Endereco` — Create
- `User` — Create

### Permissions
- **Public**: All registration endpoints

## Edge Cases & Failures

### Validation Errors
- Invalid CNPJ: Return 400
- Duplicate email: Return 400

### Missing Data
- Incomplete steps: Partial registration

## Observability

### Logs/Events
- Registration steps: CNPJ, email (masked)
- Completion rate

### Metrics
- Registrations started vs completed

## Open Questions

- [ ] Should incomplete registrations be cleaned up?
- [ ] Should email verification be required?

