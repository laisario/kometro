# Feature: Create Client

## Feature Summary

Creates a new client organization (Cliente) from the admin panel. Supports empresa (company), endereco (address), and criterio_frequencia_padrao fields. User assignment is optional and can be done later via invite flow.

## User Value

### Problem Solved
Staff administrators need to create new client organizations directly from the admin panel without relying on user self-registration. This enables commercial managers to set up prospective clients before inviting users.

### Who Benefits
- **Staff/Administrators**: Create new client organizations
- **Commercial Managers**: Set up prospective clients for proposals
- **System Administrators**: Onboard new organizations

## Scope

### In Scope
- Create Cliente with empresa (company) details
- Create/endereco (address) fields
- Set criterio_frequencia_padrao (frequency criterion)
- Reuse existing empresa if CNPJ matches
- Reuse existing endereco if full match
- Users NOT assigned on creation (separate invite flow later)

### Out of Scope
- User invitation during client creation (separate feature)
- Bulk client creation
- Client transfer between accounts

## User Flow

### Primary Flow
1. Staff navigates to Clients page
2. Staff clicks "New Client" button
3. Staff fills empresa fields (razao_social, cnpj, optional IE/nome_fantasia)
4. Staff fills endereco fields (cep, logradouro, numero, bairro, cidade, uf)
5. Staff selects criterio_frequencia_padrao (default: Calendar Time)
6. System validates uniqueness of CNPJ
7. System creates empresa (if new), endereco (if new), cliente
8. System returns created client details

### Alternate Flows

#### Duplicate CNPJ Error
- System detects CNPJ already exists for another empresa
- Returns 400 error with specific message
- Staff must either use existing empresa or modify CNPJ

#### Missing Required empresa Fields
- System returns 400 with validation errors
- Lists all missing fields

## Acceptance Criteria

- [ ] Creates empresa if razao_social provided
- [ ] Reuses existing empresa if CNPJ matches
- [ ] Creates endereco if address fields provided
- [ ] Reuses existing endereco if CEP+numero+logradouro+bairro matches
- [ ] Sets criterio_frequencia_padrao with default "C" (Calendar)
- [ ] Returns created client with 201 status
- [ ] Does NOT require usuarios (users) on creation

## Backend Behavior

### Endpoints
- `POST /clientes/` — Create new client

### Request Body
```json
{
  "empresa": {
    "razao_social": "Empresa Ltda",
    "cnpj": "12345678000100",
    "ie": "123456789",
    "nome_fantasia": "Nome Fantasia",
    "filial": "Filial XYZ",
    "isento": false
  },
  "endereco": {
    "cep": "12345678",
    "logradouro": "Rua Example",
    "numero": 100,
    "complemento": "Sala 1",
    "bairro": "Bairro Example",
    "cidade": "Cidade Example",
    "uf": "SP"
  },
  "criterio_frequencia_padrao": "C"
}
```

### Business Rules
- If empresa.cnpj matches existing empresa, reuse it (get_or_create)
- If endereco matches existing, reuse it (get_or_create)
- criterio_frequencia_padrao defaults to "C" (Calendar Time)
- estadocached fields default to 0 on creation

### Validations
- `empresa.razao_social` — Required, max 512 chars
- `empresa.cnpj` — Required, unique (or reuse existing), max 25 chars
- `empresa.ie` — Optional, max 50 chars
- `empresa.nome_fantasia` — Optional, max 512 chars
- `empresa.filial` — Optional, max 512 chars
- `empresa.isento` — Optional, default false
- `endereco.cep` — Optional, max 10 chars
- `endereco.logradouro` — Optional (required if other address fields present)
- `endereco.numero` — Optional (required if other address fields present)
- `endereco.bairro`, `cidade`, `uf` — Optional as group
- `criterio_frequencia_padrao` — Optional, must be "C" or "S"

## Data & Permissions

### Entities Touched
- `Empresa` — Create or Read (get_or_create)
- `Endereco` — Create or Read (get_or_create)
- `Cliente` — Create
- `UF`, `Cidade`, `Bairro` — Create (get_or_create)

### Permissions
- **Staff Only**: Create new clients (is_staff=True)
- **Non-staff**: Cannot create clients via this endpoint

## Edge Cases & Failures

### Validation Errors
- Missing empresa.razao_social: Return field error
- Invalid empresa.cnpj format: Return field error
- Invalid endereco fields: Return field errors

### Permission Denied
- Non-staff user attempts create: Return 403 Forbidden

### Network/Integration Failures
- Database error: Return 500 with error message

## Observability

### Logs/Events
- Client creation attempts: Log user, empresa name
- Creation success: Log new client ID and empresa name

## Open Questions

- [ ] Should empresa.isento default to false if not specified?
- [ ] Should address be optional or required?
- [ ] Should we validate CNPJ format?

## Implementation Checklist

- [ ] Create `ClienteCreateSerializer` with empresa/endereco nested objects
- [ ] Update `ClienteViewSet` to support create action with `ClienteCreateSerializer`
- [ ] Add unique validator for empresa.cnpj
- [ ] Add address field validation (CEP format check)
- [ ] Implement get_or_create logic for empresa and endereco
- [ ] Add staff permission check for create action
- [ ] Write unit test: Create client with empresa only
- [ ] Write unit test: Create client with empresa and endereco
- [ ] Write unit test: Reuse existing empresa (CNPJ match)
- [ ] Write unit test: Client creation without users succeeds
- [ ] Write unit test: Non-staff cannot create client (403)