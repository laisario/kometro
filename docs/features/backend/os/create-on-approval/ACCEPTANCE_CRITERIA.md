# Acceptance Criteria: OS V2 + Proposal Service Selection

> **Date**: 2025-01-XX  
> **Status**: Planning  
> **Related Docs**: 
> - [OS V2 Plan](./plan.v2.md)
> - [Implementation Plan](./IMPLEMENTATION_PLAN.md)

## Overview

This document defines acceptance criteria for the OS V2 and Proposal Service Selection features. Each criterion must be testable and verifiable.

## Proposal Service Selection

### PS-1: Proposal Creation with Service Selection

**Given**: User is creating a new proposal  
**When**: User selects instruments and configures service selections  
**Then**: 
- [ ] Proposal is created with instrument selections stored
- [ ] All selected instruments have complete selections (service_kind, local)
- [ ] tipo_servico is read from instrument data, not from proposal selection
- [ ] API returns 201 with proposal data including selecoes
- [ ] Database contains PropostaInstrumento records

**Test Cases**:
- Create proposal with 3 instruments, all with selections
- Create proposal with 1 instrument, verify selection stored
- Attempt to create proposal with incomplete selections → 400 error

### PS-2: Proposal Update with Service Selection

**Given**: User is editing an existing proposal (status != "A")  
**When**: User updates instrument selections  
**Then**:
- [ ] Selections are updated in database
- [ ] API returns 200 with updated data
- [ ] Old selections are replaced (not duplicated)

**Test Cases**:
- Update service_kind for instrument
- Update local for instrument
- Add new instrument with selections
- Remove instrument (selections deleted)

### PS-3: Backward Compatibility

**Given**: Existing proposal without instrument selections  
**When**: Proposal is accessed  
**Then**:
- [ ] Proposal displays with default selections (from proposta.local)
- [ ] User can add selections
- [ ] Old proposals continue to work

**Test Cases**:
- Load old proposal, verify defaults applied
- Edit old proposal, add selections
- Approve old proposal, OS generated with defaults

### PS-4: Validation

**Given**: User submits proposal with invalid data  
**When**: Validation fails  
**Then**:
- [ ] API returns 400 with error messages
- [ ] Error messages are clear and specific
- [ ] Frontend displays errors inline

**Test Cases**:
- Missing service_kind → error
- Invalid local value → error
- Invalid local value → error
- tipo_servico is read from instrument, not validated in proposal
- Instrument not belonging to client → error

## OS Generation

### OS-1: OS Generation on Approval

**Given**: Proposal is approved (status = "A")  
**When**: Approval action is triggered  
**Then**:
- [ ] Celery task is triggered
- [ ] OS are created based on grouping rules
- [ ] OS have correct tipo_os
- [ ] OS have status "a_realizar"
- [ ] Instruments are linked via InstrumentoOS

**Test Cases**:
- Approve proposal with 6 instruments (2 calibracao-cliente, 2 calibracao-permanente, 2 manutencao) → 3 OS created
- Approve proposal with balança → OS Balanças created
- Approve proposal with terceirizado → OS Serviços Externos created

### OS-2: Grouping Rules

**Given**: Proposal with instruments having different selections  
**When**: OS are generated  
**Then**:
- [ ] Instruments grouped by location
- [ ] Instruments grouped by tipo_servico (read from instrument.tipo_de_servico)
- [ ] Instruments grouped by service_kind
- [ ] Balanças grouped into OS Balanças
- [ ] Terceirizado grouped into OS Serviços Externos

**Test Cases**:
- 3 instruments: calibracao-cliente (all with tipo_servico=acreditado from instrument) → 1 OS Calibração
- 3 instruments: 2 calibracao-cliente, 1 calibracao-permanente → 2 OS Calibração
- 2 balanças + 2 termômetros → 1 OS Balanças + 1 OS Calibração
- 2 terceirizado → 1 OS Serviços Externos

### OS-3: OS Types

**Given**: Different instrument combinations  
**When**: OS are generated  
**Then**:
- [ ] OS Calibração created for calibracao service
- [ ] OS Balanças created for balança instruments
- [ ] OS Manutenção created for manutencao service
- [ ] OS Serviços Externos created for terceirizado location

**Test Cases**:
- Verify tipo_os = "CAL" for calibration OS
- Verify tipo_os = "BAL" for scale OS
- Verify tipo_os = "MAN" for maintenance OS
- Verify tipo_os = "EXT" for external service OS

### OS-4: Idempotency

**Given**: OS generation task is triggered multiple times  
**When**: Task runs  
**Then**:
- [ ] No duplicate OS created
- [ ] Task returns early if OS already exist
- [ ] Database constraints prevent duplicates

**Test Cases**:
- Trigger task twice → only one set of OS created
- Trigger task after manual OS creation → no duplicates
- Verify unique constraint on OS.numero

### OS-5: Error Handling

**Given**: OS generation task encounters error  
**When**: Task fails  
**Then**:
- [ ] Task retries (max 3 times)
- [ ] Error is logged
- [ ] User is notified (via status endpoint)

**Test Cases**:
- Simulate database error → task retries
- Simulate invalid data → task fails gracefully
- Verify error logging

## OS Management

### OM-1: OS List

**Given**: User views OS list  
**When**: List is loaded  
**Then**:
- [ ] All OS are displayed
- [ ] Filters work (tipo_os, status, responsavel)
- [ ] OS show correct tipo_os and status
- [ ] Instrument count is displayed

**Test Cases**:
- Filter by tipo_os = "CAL" → only calibration OS shown
- Filter by status = "AR" → only "a realizar" OS shown
- Verify instrument count is correct

### OM-2: OS Detail

**Given**: User views OS detail  
**When**: Detail page is loaded  
**Then**:
- [ ] OS information is displayed
- [ ] Instruments are listed with InstrumentoOS fields
- [ ] Type-specific fields are shown
- [ ] Certificate numbers are displayed (if generated)

**Test Cases**:
- View OS Calibração → shows local, tipo_servico (from instrument)
- View OS Balanças → shows fabricante, numero_serie, carga_maxima
- View OS Manutenção → shows descricao_anomalia
- View OS Serviços Externos → shows quantidade

### OM-3: Instrument Reallocation

**Given**: User wants to move instrument to another OS  
**When**: Reallocation is performed  
**Then**:
- [ ] Instrument is removed from source OS
- [ ] Instrument is added to target OS
- [ ] Item numbers are recalculated
- [ ] API returns 200

**Test Cases**:
- Move instrument to existing OS → instrument moved
- Move instrument to new OS → new OS created, instrument moved
- Verify item numbers updated
- Verify InstrumentoOS record updated

### OM-4: Certificate Generation

**Given**: User wants to generate certificate number  
**When**: Generation is triggered  
**Then**:
- [ ] Certificate number is generated (format: {os_numero}-{item:03d})
- [ ] Number is stored in InstrumentoDoCliente.numero_certificado
- [ ] Number is unique
- [ ] For calibration OS: auto-generated on OS creation
- [ ] For other OS: manual button generates number

**Test Cases**:
- Generate certificate for OS Calibração → auto-generated
- Generate certificate for OS Manutenção → manual button works
- Verify certificate number format
- Verify uniqueness constraint

## OS Status Workflow

### SW-1: Status Transitions

**Given**: OS with current status  
**When**: Status is changed  
**Then**:
- [ ] Valid transitions are allowed
- [ ] Invalid transitions are rejected
- [ ] Status is updated in database
- [ ] API returns 200

**Test Cases**:
- a_realizar → em_andamento → allowed
- em_andamento → realizado → allowed
- a_realizar → cancelado → allowed
- realizado → em_andamento → rejected
- cancelado → em_andamento → rejected

### SW-2: Billing Release

**Given**: OS is marked as "realizado"  
**When**: Status changes to "realizado"  
**Then**:
- [ ] Proposal billing release is enabled
- [ ] User can release for billing
- [ ] Billing release date is set

**Test Cases**:
- Mark OS as realizado → billing enabled
- Release for billing → date set
- Verify proposal.data_liberacao_faturamento set

## Frontend

### FE-1: Proposal Creation Form

**Given**: User creates proposal  
**When**: Form is displayed  
**Then**:
- [ ] Instrument selection table is shown
- [ ] Service selection fields are displayed per instrument
- [ ] Validation works (client-side)
- [ ] Form submits with correct payload

**Test Cases**:
- Select 3 instruments → 3 rows in table
- Fill all selections → form valid
- Leave selection empty → validation error
- Submit form → correct API payload sent

### FE-2: OS Generation Progress

**Given**: Proposal is approved  
**When**: OS generation starts  
**Then**:
- [ ] Loading indicator is shown
- [ ] Status is polled
- [ ] Success message displayed on completion
- [ ] User can navigate to OS list

**Test Cases**:
- Approve proposal → loading shown
- Poll status → updates displayed
- Generation complete → success message
- Navigate to OS list → OS visible

### FE-3: OS Management UI

**Given**: User manages OS  
**When**: UI is displayed  
**Then**:
- [ ] OS list shows all OS
- [ ] Filters work correctly
- [ ] Reallocation dialog works
- [ ] Certificate generation buttons work

**Test Cases**:
- View OS list → all OS displayed
- Filter by tipo_os → filtered results
- Open reallocation dialog → works
- Click certificate button → number generated

## Performance

### PERF-1: OS Generation Performance

**Given**: Proposal with 100 instruments  
**When**: OS are generated  
**Then**:
- [ ] Generation completes within 30 seconds
- [ ] Database queries are optimized
- [ ] No N+1 queries

**Test Cases**:
- Generate OS for 100 instruments → < 30s
- Check query count → < 50 queries
- Verify select_related/prefetch_related used

### PERF-2: Proposal List Performance

**Given**: 1000 proposals  
**When**: List is loaded  
**Then**:
- [ ] Page loads within 2 seconds
- [ ] Pagination works
- [ ] No performance degradation

**Test Cases**:
- Load proposal list → < 2s
- Paginate → works smoothly
- Filter → < 1s response

## Security

### SEC-1: Authorization

**Given**: User accesses OS endpoints  
**When**: Request is made  
**Then**:
- [ ] Only staff can view OS
- [ ] Only gerente can update OS
- [ ] Only gerente can reallocate instruments
- [ ] Only gerente can finalize OS

**Test Cases**:
- Non-staff user → 403 error
- Staff user updates OS → 403 error (not gerente)
- Gerente updates OS → 200 success

### SEC-2: Data Validation

**Given**: User submits invalid data  
**When**: Request is processed  
**Then**:
- [ ] Server-side validation works
- [ ] SQL injection prevented
- [ ] XSS prevented

**Test Cases**:
- Submit SQL injection attempt → rejected
- Submit XSS attempt → sanitized
- Submit invalid enum value → 400 error

## Backward Compatibility

### BC-1: Old Proposals

**Given**: Existing proposal without selections  
**When**: Proposal is accessed  
**Then**:
- [ ] Proposal works normally
- [ ] Default selections are applied
- [ ] OS generation works with defaults

**Test Cases**:
- Load old proposal → works
- Approve old proposal → OS generated
- Edit old proposal → can add selections

### BC-2: Old OS

**Given**: Existing OS from V1  
**When**: OS is accessed  
**Then**:
- [ ] OS displays correctly
- [ ] tipo_os defaults to "CAL"
- [ ] status defaults to "AR"
- [ ] No errors occur

**Test Cases**:
- View old OS → displays correctly
- Update old OS → works
- Verify defaults applied

## Documentation

### DOC-1: API Documentation

**Given**: Developer uses API  
**When**: Documentation is consulted  
**Then**:
- [ ] All endpoints documented
- [ ] Request/response examples provided
- [ ] Error codes documented

**Test Cases**:
- Verify all endpoints in docs
- Verify examples are correct
- Verify error documentation

### DOC-2: User Documentation

**Given**: User uses feature  
**When**: Documentation is consulted  
**Then**:
- [ ] Feature usage documented
- [ ] Screenshots provided
- [ ] Common issues addressed

**Test Cases**:
- Verify user guide exists
- Verify screenshots
- Verify troubleshooting guide

## Summary

**Total Criteria**: 50+  
**Must Pass**: All  
**Priority**: 
- **P0 (Critical)**: PS-1, OS-1, OS-2, OM-1, OM-2, SW-1, FE-1
- **P1 (High)**: PS-2, OS-3, OM-3, OM-4, FE-2, FE-3
- **P2 (Medium)**: PS-3, OS-4, SW-2, PERF-1, BC-1
- **P3 (Low)**: PS-4, OS-5, PERF-2, SEC-1, SEC-2, BC-2, DOC-1, DOC-2
