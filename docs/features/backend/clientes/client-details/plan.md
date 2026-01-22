# Feature: Client Details

## Feature Summary

Retrieves complete details for a specific client organization including company info, address, users, and cached statistics.

## User Value

### Problem Solved
Staff and users need detailed information about an organization to manage instruments, proposals, and communications.

### Who Benefits
- **Staff**: View complete client profile
- **Users**: See their organization details

## Scope

### In Scope
- Full client profile
- Company information
- Address details
- User list
- Cached statistics

### Out of Scope
- Client editing (separate feature)
- Historical statistics

## User Flow

### Primary Flow
1. User selects client
2. System returns complete profile
3. User views information

## Acceptance Criteria

- [ ] Returns full ClienteSerializer data
- [ ] Includes empresa, endereco, usuarios
- [ ] Includes cached statistics
- [ ] Returns 404 if not found

## Backend Behavior

### Endpoints
- `GET /clientes/{id}/` — Get client details

### Response includes
- empresa (razao_social, cnpj, nome_fantasia)
- endereco
- usuarios list
- instrumentos_vencidos, instrumentos_em_dia
- instrumentos_cadastrados
- propostas_aguardando_aprovacao

### Business Rules
- Uses ClienteSerializer for detail view
- Statistics are cached values

### Validations
- Client must exist
- User must have access

## Data & Permissions

### Entities Touched
- `Cliente` — Read
- `Empresa` — Read
- `Endereco` — Read
- `User` — Read (list)

### Permissions
- **Authenticated Users**: View own client
- **Staff Users**: View any client

## Edge Cases & Failures

### Missing Data
- Client not found: Return 404

### Permission Denied
- Accessing other client (non-staff): Return 403

## Observability

### Logs/Events
- Detail access logged

## Open Questions

- [ ] Should instrument/proposal lists be included?

