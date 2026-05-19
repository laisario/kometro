# OrdemServico Technical Visit Manual Creation - V3

> **Version**: 3.0  
> **Status**: Planning  
> **Extends**: [plan.v2.md](./plan.v2.md) (OS V2 auto-generation)  
> **Date**: 2026-05-14

## Overview

This document describes V3 of the OrdemServico (OS) feature. V3 keeps the existing automatic OS generation flow from approved Proposals and adds a narrower manual creation flow for a new OS type: Technical Visit.

Technical Visit is used when the team needs to visit a client before knowing which instruments should enter a Proposal.

Manual Technical Visit creation is an additional workflow. It does not replace, remove, or change the existing Proposal approved -> Service Orders generated automatically flow.

## Existing Automatic Flow

In the current V2 flow, Service Orders are created automatically when a `Proposta` is approved.

```text
Proposal approved by client
-> trigger criar_ordens_servico_proposta(proposta_id)
-> read proposal instruments and per-instrument selections
-> group instruments by OS rules
-> create one or more OrdemServico records
-> attach instruments through InstrumentoOS
-> generate certificate numbers according to OS type
```

The automatic flow remains responsible for operational Service Orders such as:

- `CAL` - OS Calibracao;
- `BAL` - OS Balancas;
- `MAN` - OS Manutencao;
- `EXT` - OS Servicos Externos.

The Proposal approval flow must remain unchanged:

```text
Client approves Proposal
-> Proposal status becomes approved
-> existing automatic OS generation runs
-> CAL/BAL/MAN/EXT OS records are created from Proposal instruments
```

## New OS Type

Add a new Service Order type:

```text
Technical Visit
```

Internal value:

```text
TV
```

The database/API value must be distinct from the existing V2 values (`CAL`, `BAL`, `MAN`, `EXT`).

## Technical Visit Purpose

A Technical Visit OS represents a client visit before the Proposal scope is known.

It is used when:

- the team needs to inspect the client site first;
- the client instruments that should enter a Proposal are not yet confirmed;
- the team may need to register new instruments after the visit;
- a Proposal may be created later using the final selected client instruments.

## Manual Technical Visit Creation Flow

Expected user flow:

```text
User opens EquipePage
-> clicks "Create Service Order" / "Nova Ordem de Servico"
-> system opens a simple Technical Visit form
-> user selects client
-> user selects responsible employee
-> user selects expiration date
-> user enters description
-> user submits
-> system creates one Technical Visit OS
-> OS appears in the Service Orders list
```

Manual creation must always create a Technical Visit OS. The user must not choose between `CAL`, `BAL`, `MAN`, `EXT`, or any other operational OS type in this manual form.

## Proposal-Based vs Technical Visit Creation

| Area | Proposal-based OS creation | Technical Visit manual creation |
| --- | --- | --- |
| Trigger | Client approves Proposal | Staff user clicks create OS |
| OS type | Derived by grouping rules (`CAL`, `BAL`, `MAN`, `EXT`) | Always Technical Visit |
| Proposal required | Yes | No |
| Client source | Proposal client | User-selected client |
| Instrument source | Proposal instruments/selections | None at creation |
| Instruments linked to OS | Yes, through `InstrumentoOS` | No |
| Grouping | Can create multiple OS records | Creates one OS record |
| Numbering | Existing proposal-based strategy | Automatically generated standalone number containing `TV` |
| Next step | Execute operational OS | Complete visit, then create Proposal and/or register instruments |

## Required Fields

Technical Visit creation requires:

- client;
- responsible employee;
- expiration date;
- description.

The OS number must be generated automatically.

The following fields must not be required for Technical Visit creation:

- Proposal;
- Proposal number;
- Proposal approval date;
- Proposal instrument selections;
- selected instruments;
- `InstrumentoOS` payload;
- calibration-specific dates;
- maintenance-specific dates;
- balance-specific fields;
- external-service-specific fields;
- certificate number.

## Form Behavior

The Technical Visit creation form must be simpler than the operational OS forms.

Expected fields:

1. Client.
2. Responsible employee.
3. Expiration date.
4. Description.

Rules:

- Do not show OS type selection.
- Do not show instrument selection.
- Do not show type-specific fields for `CAL`, `BAL`, `MAN`, or `EXT`.
- The created OS type is automatically set to Technical Visit.
- The form should follow the same visual style as the existing Service Orders UI.
- On success, close the form, show success feedback, and refresh the OS list/statistics.
- On error, show clear validation feedback.

## Technical Visit Data Model Expectations

Technical Visit OS records should use the existing `OrdemServico` entity where possible.

Expected OS-level data:

- `tipo_os`: Technical Visit value, `TV`;
- `cliente`: required, independent of Proposal;
- `responsavel`: required;
- `data_expiracao`: required;
- `descricao`: optional, stored in a dedicated Technical Visit description field;
- `status`: default to `A_REALIZAR` unless the current workflow defines another initial status;
- `numero`: generated automatically;
- `proposta`: null/empty.

Numbering rule:

- the OS number must be generated automatically;
- the generated number must include `TV` so Technical Visit records are identifiable by number;
- use a format similar to the existing OS numbers, but with the Technical Visit type marker/variables;
- use the same base and sequence strategy as the existing OS numbering;
- expected pattern: `{base}-OS-TV-{sequence:03d}`.

Expected relationship behavior:

- no instruments linked at creation;
- no `InstrumentoOS` records created;
- no certificate numbers generated.

## Status and Completion

Technical Visit should follow the existing OS visual/status pattern where possible.

The Technical Visit detail/list actions should always show two options:

1. Create Proposal.
2. Register Instrument.

The actions are disabled until the Technical Visit OS is completed. "Completed" maps to the existing completed status used by Service Orders, currently documented as `REALIZADO` / `RE`.

## Post-Completion Action: Create Proposal

Always show a "Create Proposal" action/button for Technical Visit OS records.

Rules:

- The button is disabled while the Technical Visit status is not completed.
- The button is enabled only when status is completed / `RE`.
- The Proposal must be created for the same client as the Technical Visit OS.
- The button opens a Proposal form with the Technical Visit client already defined.
- The client field must not allow changing to another client from this action.
- The form must let the user choose which instruments from that client will be included.
- Proposal generation from this action must run as a background job.
- The Proposal creation flow is where the user selects which client instruments will be included.
- The Technical Visit OS must not directly create operational OS records.
- After the Proposal is created, it follows the existing normal Proposal flow.
- When the client approves the Proposal, the existing automatic Proposal approved -> OS generation flow must run normally.

Expected flow:

```text
Technical Visit completed
-> user clicks Create Proposal
-> Proposal form opens with client defined from Technical Visit OS
-> user selects client instruments
-> user submits proposal generation
-> background job creates/generates the Proposal
-> Proposal follows the normal flow after the job completes
-> client approves Proposal
-> existing automatic OS generation creates CAL/BAL/MAN/EXT OS records
```

## Post-Completion Action: Register Instrument

Always show a "Register Instrument" action/button for Technical Visit OS records.

Rules:

- The button is disabled while the Technical Visit status is not completed.
- The button is enabled only when status is completed / `RE`.
- The new instrument must be linked to the same client as the Technical Visit OS.
- This action is used when the visited instrument does not yet exist in the client's instrument list.
- After registration, the new instrument can be selected later in a Proposal for the same client.
- Registering an instrument from a Technical Visit must not automatically create a Proposal.
- Registering an instrument from a Technical Visit must not automatically create operational OS records.

Expected flow:

```text
Technical Visit completed
-> user clicks Register Instrument
-> instrument creation form opens with client preselected from Technical Visit OS
-> user creates instrument
-> instrument becomes available in that client's instrument list
-> user may include it in a future Proposal
```

## Backend/API Implications

The backend must support creating a Technical Visit OS without a Proposal and without instruments.

Required changes or checks:

- Add Technical Visit as an allowed `tipo_os` choice.
- Allow `OrdemServico.proposta` to be null for Technical Visit only.
- Add a client relationship or another reliable client source for OS records without Proposal.
- Add a dedicated description field for Technical Visit.
- Add or update serializer validation for Technical Visit creation.
- Generate Technical Visit OS numbers automatically with `TV` in the number.
- Allow Technical Visit creation for users in gestor and executor roles.
- Create Proposal from Technical Visit must enqueue a background job instead of doing all proposal generation work synchronously.
- Do not create `InstrumentoOS` records for Technical Visit creation.
- Ensure list/detail serializers can represent OS records with no Proposal.
- Ensure `cliente_nome`/client display fields work for both proposal-based OS and Technical Visit OS.
- Ensure filters, "Todas", "Minhas", responsible filtering, status, and statistics include Technical Visit OS correctly.
- Include Technical Visit OS in the same statistics cards as operational OS records.
- Ensure the Proposal approval task ignores Technical Visit OS and remains idempotent based on Proposal OS records.

Possible endpoint:

```text
POST /api/ordens-servico/
```

Possible dedicated endpoint:

```text
POST /api/ordens-servico/technical-visit/
```

Use the option that best fits the existing `OrdemServicoViewSet` and permission model.

Example payload:

```json
{
  "cliente": 123,
  "responsavel": 5,
  "data_expiracao": "2026-06-30",
  "descricao": "Visit client site to identify instruments for future proposal."
}
```

The backend should set:

```json
{
  "tipo_os": "TV",
  "proposta": null,
  "numero": "generated automatically with TV",
  "status": "AR"
}
```

## Frontend Implications

Update `frontend/src/equipe/pages/EquipePage.jsx` to expose Technical Visit creation from the Service Orders card/table header.

Expected UI:

- add a compact "Create Service Order" / "Nova Ordem de Servico" button near the responsible filter;
- clicking the button opens a Technical Visit creation form;
- form fields are client, responsible employee, expiration date, and description;
- no OS type selector;
- no instrument selector;
- no operational OS type-specific fields;
- submit creates a Technical Visit OS;
- after success, close the form, show success feedback, and refresh OS list/statistics;
- list/table should show the OS type as Technical Visit.

Post-completion UI:

- always show "Create Proposal" for Technical Visit OS records;
- always show "Register Instrument" for Technical Visit OS records;
- keep both actions disabled until the Technical Visit status is completed / `RE`;
- enable both actions when the Technical Visit status is completed / `RE`;
- both actions must carry the Technical Visit client context into the target flow;
- the Proposal form should open with the Technical Visit client preselected;
- the Proposal form opened from Technical Visit should keep that client fixed and allow selecting instruments from that client;
- submitting the Proposal form should start a background job and show a processing/loading state;
- the instrument registration form should open with the Technical Visit client preselected.

Accessibility requirements:

- create button is keyboard accessible;
- dialog has accessible title/labels;
- initial focus moves to the first field;
- validation errors are visible and text-based;
- mobile layout does not create horizontal overflow.

## Validation Rules

Technical Visit creation validation:

- `cliente` is required.
- `responsavel` is required.
- `data_expiracao` is required.
- `descricao` is optional.
- `tipo_os` is server-controlled or forced to Technical Visit.
- `proposta` must be null/empty.
- creation is allowed for gestor and executor roles.
- instruments must not be accepted in the creation payload.
- `InstrumentoOS` records must not be created.
- certificate generation must not run.

Post-completion validation:

- Create Proposal and Register Instrument actions are visible for Technical Visit OS records regardless of status.
- Create Proposal and Register Instrument actions are enabled only when the Technical Visit status is completed / `RE`.
- Create Proposal action requires the Technical Visit OS to have a client.
- Created Proposal must use the same client as the Technical Visit OS.
- Proposal generation from Technical Visit must run as a background job.
- Register Instrument action requires the Technical Visit OS to have a client.
- Registered instrument must be linked to the same client as the Technical Visit OS.

Existing automatic flow validation:

- Proposal approval still uses Proposal instruments and selections.
- Proposal approval still generates `CAL`, `BAL`, `MAN`, and `EXT` OS records through the existing grouping rules.
- Proposal approval idempotency remains proposal-based.
- Technical Visit OS records must not interfere with Proposal approval idempotency.
- Technical Visit OS records are included in the same OS statistics cards as operational OS records.

## Risks

- Existing serializers may assume every OS has a Proposal.
- Existing list/detail UI may read client data only through `proposta.cliente`.
- Existing OS numbering may depend on `proposta.numero`.
- Existing OS type labels may only handle `CAL`, `BAL`, `MAN`, and `EXT`.
- Existing detail dialogs may assume instruments exist.
- Existing certificate actions may appear for Technical Visit even though they should not.
- Existing billing/proposal actions may assume a Proposal-linked OS.
- Adding a nullable Proposal relation must not weaken the automatic Proposal approval flow.
- Technical Visit completion actions must not accidentally create operational OS directly.

## Acceptance Criteria

- Existing Proposal approved -> OS auto-generation still works.
- Technical Visit is available as a new OS type.
- Manual create action creates only Technical Visit OS records.
- Technical Visit uses `TV` as its internal type value.
- Technical Visit numbers are generated automatically and contain `TV`.
- Technical Visit number format follows the existing OS base and sequence strategy with the `TV` marker, e.g. `{base}-OS-TV-{sequence:03d}`.
- Technical Visit creation does not require Proposal.
- Technical Visit creation requires client, responsible employee, expiration date, and description.
- Technical Visit uses a dedicated description field.
- Technical Visit creation is available to gestor and executor roles.
- Technical Visit creation does not require or accept instruments.
- Technical Visit creation does not create `InstrumentoOS` records.
- Technical Visit creation does not generate certificate numbers.
- Technical Visit OS appears in the Service Orders list with correct client/responsible/status data.
- Technical Visit OS is counted in the same statistics cards as operational OS records.
- Technical Visit OS always shows Create Proposal and Register Instrument actions.
- Create Proposal and Register Instrument are disabled until status is completed / `RE`.
- Create Proposal and Register Instrument are enabled when status is completed / `RE`.
- Create Proposal uses the same client as the Technical Visit OS.
- Create Proposal opens a form with the client already defined and instruments available for selection.
- Create Proposal generation runs as a background job.
- Register Instrument links the new instrument to the same client as the Technical Visit OS.
- The existing Proposal approval flow continues generating operational OS records normally.
