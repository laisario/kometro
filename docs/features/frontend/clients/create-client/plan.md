# Feature: Create Client (Frontend)

## Feature Summary

Admin form for creating new client organizations from the Clients page. Supports empresa (company) fields, optional address, and frequency criterion selection.

## User Value

### Problem Solved
Staff administrators need a form to create new clients directly from the admin panel without using the public registration flow.

### Who Benefits
- **Staff/Administrators**: Create new client organizations
- **Commercial Managers**: Set up prospective clients

## Scope

### In Scope
- "Novo Cliente" button on Clients page
- Modal form with empresa fields (required)
- Endereco fields (required)
- Frequencia criterion dropdown
- Form validation

### Out of Scope
- User invitation during creation
- Bulk creation modal

## User Flow

### Primary Flow
1. Staff clicks "Novo Cliente" button
2. Form opens with empresa section expanded
3. Staff enters empresa details (razao_social required, cnpj required)
4. Staff enters additional empresa fields (optional)
5. Staff expands endereco section and enters address (required)
6. Staff selects frequencia criterion (default "Calendário")
7. Staff clicks "Criar"
8. System creates client and refreshes list
9. Form closes, list updates

### Prerequisites
- empresa (company) MUST be provided
- endereco (address) MUST be provided

### Alternate Flows

#### Duplicate CNPJ
- Show error message
- User must modify CNPJ or use existing

#### Missing Required Fields
- Highlight required fields
- Block submission

## Acceptance Criteria

- [ ] "Novo Cliente" button visible on ClientsPage
- [ ] Form modal renders with empresa fields
- [ ] CNPJ field is required
- [ ] Razao social field is required
- [ ] Address fields ARE REQUIRED (not optional)
- [ ] Frequency criterion shows options (C=Calendário, S=Serviço)
- [ ] Frequency criterion defaults to "C"
- [ ] Form validates before submission
- [ ] Success shows message and closes form
- [ ] Error shows validation messages
- [ ] FAILS if empresa not provided
- [ ] FAILS if endereco not provided

## Frontend Behavior

### Screens/Components
- `CreateClient.jsx` — Form component (new file)
- `ClientsPage.jsx` — Add button
- `TableToolbar.jsx` — Add button to toolbar

### Key States
- **Initial**: Empty form
- **Filling**: Data entered
- **Validating**: Checking fields
- **Submitting**: Saving
- **Success**: Close and refresh list
- **Error**: Show errors

### Form Fields
| Field | Required | Default |
|-------|----------|---------|
| razao_social | Yes | — |
| cnpj | Yes | — |
| ie | No | — |
| nome_fantasia | No | — |
| filial | No | — |
| isento | No | false |
| cep | Yes | — |
| logradouro | Yes | — |
| numero | Yes | — |
| complemento | No | — |
| bairro | Yes | — |
| cidade | Yes | — |
| uf | Yes | — |
| criterio_frequencia_padrao | No | "C" |

### Form Validations
- razao_social: Required, max 512 chars
- cnpj: Required, unique
- ie: Optional (max 50 if provided)
- nome_fantasia: Optional (max 512)
- filial: Optional (max 512)
- cep: Required, max 10 chars
- logradouro: Required
- numero: Required (number)
- bairro, cidade, uf: All required as group
- criterio_frequencia_padrao: "C" or "S"

## UX Design

### Form Type
- MUI Dialog modal (responsive, fullscreen on mobile)
- Title: "Novo Cliente"
- Form sections using Accordion pattern:
  1. Empresa - Always expanded (required)
  2. Endereço - Always expanded (required as part of client creation)
  3. Preferências (optional) - Collapsible

### Buttons
- Cancel: Close form without saving
- Criar: Submit form

### Feedback
- Success: Snackbar "Cliente criado com sucesso!"
- Error: Inline field errors or snackbar

## Data & Permissions

### Entities Touched
- `Cliente` — Create (POST)
- `Empresa` — Create/Read
- `Endereco` — Create/Read

### Permissions
- **Staff**: Full access
- **Non-staff**: Cannot access (button hidden)

## State Management
- React Query: Invalidate 'clientes' on success
- React Hook Form: Form state

## Edge Cases & Failures

### Validation Errors
- Required empresa fields empty: Highlight with error text
- Required endereco fields empty: Highlight with error text
- CNPJ already exists: Show specific error

### Network Failures
- API timeout: Show generic error snackbar

### Edge Cases
- All empresa fields required: Block if any missing
- All endereco fields required: Block if any missing

## Observability

### UX Events
- Form open event
- Form submit attempt (success/failure)
- Validation failures

## Implementation Checklist

- [ ] Create `useCreateClient.js` hook
- [ ] Create `CreateClient.jsx` form component with empresa/endereco sections
- [ ] Add "Novo Cliente" Button to ClientsPage
- [ ] Add create mutation to useClientMutations
- [ ] Wire form to API POST /clientes/
- [ ] Handle form validation (empresa required, endereco required)
- [ ] Handle success (invalidate, close, notify)
- [ ] Handle error display
- [ ] Write test: Form renders
- [ ] Write test: Form validates empresa required fields
- [ ] Write test: Form validates endereco required fields
- [ ] Write test: Successful creation with empresa + endereco
- [ ] Write test: Error displays (including missing fields)