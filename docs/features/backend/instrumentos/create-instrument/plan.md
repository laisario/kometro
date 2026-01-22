# Feature: Create Instrument

## Feature Summary

Creates a new instrument instance (InstrumentoDoCliente) associated with a client. The instrument is linked to a base instrument type, assigned a unique tag, and can have calibration frequencies, acceptance criteria, and normative standards configured.

## User Value

### Problem Solved
Organizations need to register new measuring instruments into the system so they can be tracked, scheduled for calibration, and included in proposals. Without this, instruments would be managed outside the system.

### Who Benefits
- **Quality Managers**: Register instruments to maintain compliance tracking
- **Lab Technicians**: Add new instruments to the calibration schedule
- **Maintenance Supervisors**: Onboard instruments for their departments

## Scope

### In Scope
- Create instrument with required fields (tag, client, instrument type)
- Set calibration and verification frequencies
- Define acceptance criteria with tolerance values
- Associate with normative standards
- Assign to a sector
- Set initial position status

### Out of Scope
- Bulk instrument creation (separate feature)
- Import from spreadsheet (separate feature)
- Automatic calibration scheduling on creation

## User Flow

### Primary Flow
1. User selects base instrument type
2. User enters unique tag and optional serial number
3. User sets calibration frequency and position
4. User optionally adds acceptance criteria
5. User optionally assigns normative standards
6. System validates uniqueness of tag within client
7. System creates instrument and returns details

### Alternate Flows

#### Duplicate Tag Error
- System detects tag already exists for client
- Returns 400 error with specific message
- User must choose different tag

#### Missing Required Fields
- System returns 400 with validation errors
- Lists all missing/invalid fields

## Acceptance Criteria

- [ ] Creates instrument with unique tag per client
- [ ] Associates instrument with specified base instrument type
- [ ] Sets default position if not provided
- [ ] Calculates initial next calibration date based on frequency criterion
- [ ] Increments client's instrument count cache
- [ ] Returns created instrument details with 201 status

## Backend Behavior

### Endpoints
- `POST /instrumentos/` — Create new instrument

### Request Body
```json
{
  "tag": "TERM-001",
  "numero_de_serie": "SN123456",
  "instrumento": 1,
  "cliente": 1,
  "setor": 1,
  "posicao": "U",
  "frequencia_calibracao": 1,
  "frequencia_checagem": 2,
  "criterio_frequencia": "C",
  "normativos": [1, 2],
  "criterios_aceitacao": [
    {"tipo": "Temperatura", "criterio_de_aceitacao": 0.5, "unidade": "°C"}
  ]
}
```

### Business Rules
- Tag must be unique within the client (enforced by database constraint)
- If frequency criterion is "Service Time", next calibration date is only set when position is "In Use"
- If frequency criterion is "Calendar Time", next calibration date is set immediately based on current date
- Client's `instrumentos_cadastrados` count is incremented on successful creation

### Validations
- `tag` — Required, unique per client
- `instrumento` — Required, must exist
- `cliente` — Required, must exist, user must have access
- `posicao` — Must be valid choice (U, E, I, F, C)
- `frequencia_calibracao` — Must reference existing Frequencia
- `criterio_frequencia` — Must be C (Calendar) or S (Service)

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Create
- `Cliente` — Update (instrument count)
- `CriterioAceitacao` — Create (nested)
- `PontoDeCalibracao` — Create (nested, if provided)

### Permissions
- **Authenticated Users**: Can create for own client
- **Staff Users**: Can create for any client (with client parameter)

## Edge Cases & Failures

### Validation Errors
- Duplicate tag: Return 400 with "Tag já existe para este cliente"
- Invalid instrument type: Return 400 with "Instrumento não encontrado"
- Invalid sector: Return 400 with "Setor não encontrado"

### Missing Data
- Missing required fields: Return 400 with list of missing fields

### Permission Denied
- Creating for another client (non-staff): Return 403

### Network/Integration Failures
- Transaction failure: Rollback all changes, return 500

## Observability

### Logs/Events
- Instrument creation with instrument ID, client ID, user ID
- Failed creation attempts with error reason

### Metrics
- Instruments created per day/client
- Validation error frequency by field

## Open Questions

- [ ] Should instrument creation trigger welcome email notification?
- [ ] Should there be a limit on instruments per client?

