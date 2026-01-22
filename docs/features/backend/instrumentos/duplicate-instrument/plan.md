# Feature: Duplicate Instrument

## Feature Summary

Creates a copy of an existing instrument with a new unique tag. Copies all attributes including acceptance criteria, calibration points, and normative associations. Automatically generates a versioned tag (e.g., "TAG-001-v2") to ensure uniqueness.

## User Value

### Problem Solved
Organizations often have multiple identical instruments. Rather than manually entering all the same configuration details, users can duplicate an existing instrument and only modify what's different.

### Who Benefits
- **Quality Managers**: Quickly onboard identical instruments with same specifications
- **Lab Technicians**: Save time when adding similar equipment
- **Administrators**: Reduce data entry errors through copying

## Scope

### In Scope
- Copy all instrument fields (except unique identifiers)
- Generate unique versioned tag
- Copy acceptance criteria
- Copy calibration points
- Copy normative associations
- Clear cache after duplication

### Out of Scope
- Copying calibration history
- Copying certificates
- Bulk duplication
- Custom tag naming during duplication

## User Flow

### Primary Flow
1. User selects existing instrument
2. User triggers duplicate action
3. System generates unique versioned tag
4. System copies all copyable attributes
5. System creates new instrument with copied data
6. System returns new instrument details

### Alternate Flows

#### Multiple Duplicates
- First duplicate: TAG-001 → TAG-001-v2
- Second duplicate: TAG-001 → TAG-001-v3
- Handles existing versioned tags correctly

#### Version Collision Detection
- System finds highest existing version number
- Increments to next available version

## Acceptance Criteria

- [ ] Creates new instrument with all attributes from source
- [ ] Generates unique tag with version suffix (-v2, -v3, etc.)
- [ ] Copies all acceptance criteria to new instrument
- [ ] Copies all calibration points to new instrument
- [ ] Maintains normative associations (M2M)
- [ ] Returns new instrument with 201 status
- [ ] Clears sector hierarchy cache after creation

## Backend Behavior

### Endpoints
- `POST /instrumentos/{id}/duplicar/` — Duplicate instrument

### Response
```json
{
  "id": 123,
  "tag": "TERM-001-v2",
  "numero_de_serie": "SN123456",
  "instrumento": { ... },
  "cliente": { ... },
  ...
}
```

### Tag Versioning Logic
1. Extract base tag (remove existing -vN suffix if present)
2. Query all tags matching base or base-vN pattern
3. Find highest version number
4. Generate new tag as base-v(max+1)

Example:
- Base: "TERM-001"
- Existing: ["TERM-001", "TERM-001-v2"]
- New: "TERM-001-v3"

### Business Rules
- Uses atomic transaction to ensure all-or-nothing creation
- Copies fields via iteration over model._meta.fields
- Skips primary key and auto-created fields
- Sets new tag before save
- Creates new PontoDeCalibracao records (not references)
- Creates new CriterioAceitacao records (not references)
- Sets M2M normativos to same set as original

### Validations
- Source instrument must exist
- User must have permission to access source instrument

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Read (source), Create (duplicate)
- `PontoDeCalibracao` — Read (source), Create (duplicates)
- `CriterioAceitacao` — Read (source), Create (duplicates)
- `Normativo` — Read (for M2M association)
- Cache — Delete (hierarquia:{client_id})

### Permissions
- **Authenticated Users**: Can duplicate own client's instruments
- **Staff Users**: Can duplicate any instrument

## Edge Cases & Failures

### Validation Errors
- IntegrityError (unexpected): Return 400 with error details

### Missing Data
- Source instrument not found: Return 404

### Permission Denied
- Duplicating another client's instrument (non-staff): Return 403

### Network/Integration Failures
- Transaction failure: Rollback all, return 400 with error

## Observability

### Logs/Events
- Duplication event: source ID, new ID, new tag, user
- Failed duplications with error details

### Metrics
- Duplications per period
- Most frequently duplicated instruments

## Open Questions

- [ ] Should user be able to specify custom tag for duplicate?
- [ ] Should duplicates inherit the same calibration dates or start fresh?
- [ ] Should there be a limit on duplicate versions?

