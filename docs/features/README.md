# Feature Documentation Guide

This directory contains the Product Design Documentation (PDD) for all features in KOMETROgo, organized by platform (backend/frontend), module, and feature.

## Directory Structure

```
docs/features/
├── README.md                    # This file
├── backend/
│   ├── <module>/
│   │   └── <feature>/
│   │       └── plan.md
└── frontend/
    ├── <module>/
    │   └── <feature>/
    │       └── plan.md
```

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Module folders | `kebab-case` or `snake_case` (be consistent) | `instrumentos`, `propostas` |
| Feature folders | `kebab-case` (required) | `create-instrument`, `export-proposals` |
| Plan file | Always `plan.md` | `plan.md` |

Feature names should be **descriptive and action-oriented**:
- ✅ `create-instrument`
- ✅ `approve-revision`
- ✅ `export-proposals`
- ❌ `instrument` (too vague)
- ❌ `misc-stuff` (not descriptive)

---

## How to Add a New Feature

### Step 1: Identify the Module

Determine which module your feature belongs to:

**Backend modules:**
- `instrumentos` — Instrument registry and management
- `calibracoes` — Calibration records and certificates
- `propostas` — Commercial proposals
- `documentos` — Document control and versioning
- `clientes` — Client management
- `auth` — Authentication and registration
- `setores` — Sector/department management

**Frontend modules:**
- `assets` — Instrument UI components and pages
- `proposals` — Proposal UI components and pages
- `documents` — Document UI components and pages
- `dashboard` — Dashboard and metrics
- `auth` — Login, registration, password reset
- `clients` — Client management (admin)
- `access` — User access and invitations

### Step 2: Create the Feature Folder

```bash
# For backend feature
mkdir -p docs/features/backend/<module>/<feature-name>

# For frontend feature
mkdir -p docs/features/frontend/<module>/<feature-name>
```

### Step 3: Create and Fill `plan.md`

Create the `plan.md` file inside your feature folder:

```bash
touch docs/features/backend/<module>/<feature-name>/plan.md
```

Use the template below to populate the file.

---

## `plan.md` Template

Every `plan.md` must include these sections, **in this exact order**:

```markdown
# Feature: <Feature Name>

## Feature Summary

<2-5 lines describing what this feature does>

## User Value

### Problem Solved
<What problem does this feature address?>

### Who Benefits
<Which user personas benefit from this feature?>

## Scope

### In Scope
- <Item 1>
- <Item 2>

### Out of Scope
- <Item 1>
- <Item 2>

## User Flow

### Primary Flow
1. <Step 1>
2. <Step 2>
3. <Step 3>

### Alternate Flows

#### Empty State
- <What happens when there's no data?>

#### Error State
- <What happens when an error occurs?>

## Acceptance Criteria

- [ ] <Testable statement 1>
- [ ] <Testable statement 2>
- [ ] <Testable statement 3>

## Backend/Frontend Behavior

### For Backend `plan.md`:
#### Endpoints
- `METHOD /path` — Description

#### Business Rules
- <Rule 1>
- <Rule 2>

#### Validations
- <Validation 1>
- <Validation 2>

### For Frontend `plan.md`:
#### Screens/Components
- `ComponentName` — Purpose

#### Key States
- Loading
- Empty
- Error
- Success

#### Form Validations
- <Validation 1>
- <Validation 2>

## Data & Permissions

### Entities Touched
- `ModelName` — Read/Write/Delete

### Permissions
- <Role 1>: <Access level>
- <Role 2>: <Access level>

## Edge Cases & Failures

### Validation Errors
- <Scenario 1>: <Expected behavior>

### Missing Data
- <Scenario 1>: <Expected behavior>

### Permission Denied
- <Scenario 1>: <Expected behavior>

### Network/Integration Failures
- <Scenario 1>: <Expected behavior>

## Observability

### Logs/Events
- <Event 1>: <When logged>
- <Event 2>: <When logged>

### Metrics (Optional)
- <Metric 1>: <What it measures>

## Open Questions

- [ ] <Question 1>
- [ ] <Question 2>
```

---

## Definition of Done for Documentation

A feature's documentation is considered complete when:

1. ✅ `plan.md` exists in the correct location
2. ✅ All required sections are present
3. ✅ Feature summary is clear and concise (2-5 lines)
4. ✅ User flow covers primary and alternate paths
5. ✅ Acceptance criteria are testable statements
6. ✅ Backend/Frontend behavior is documented (no code, just rules)
7. ✅ Data entities and permissions are identified
8. ✅ Edge cases are considered
9. ✅ Open questions are documented (if any unknowns exist)

---

## Tips for Writing Good Documentation

### DO:
- Write from the user's perspective
- Use concrete examples
- Be specific about edge cases
- Mark unknowns in "Open Questions"
- Keep language neutral and professional

### DON'T:
- Include implementation details or code
- Use filler text ("Lorem ipsum", "TBD everywhere")
- Skip edge cases or error handling
- Leave sections completely empty

---

## Existing Modules Reference

### Backend

| Module | Description | Features |
|--------|-------------|----------|
| `instrumentos` | Instrument CRUD and management | list, create, update, delete, change-position, duplicate, export |
| `calibracoes` | Calibration records | list, create, certificates, attachments, verifications |
| `propostas` | Commercial proposals | list, create, elaborate, approve, reject, email, export |
| `documentos` | Document control | list, create, revisions, approvals, export |
| `clientes` | Client management | list, details, dashboard |
| `auth` | Authentication | login, register, invites, password-reset |
| `setores` | Sector management | list, create, update, delete, hierarchy |

### Frontend

| Module | Description | Features |
|--------|-------------|----------|
| `assets` | Instrument UI | list, details, create, edit, position, sectors, calibrations |
| `proposals` | Proposal UI | list, details, create, elaborate, approve/reject, email |
| `documents` | Document UI | list, details, create, reviews, approvals |
| `dashboard` | Dashboard UI | stats, recent items, pending approvals |
| `auth` | Auth UI | login, register flow, invite registration, password reset |
| `clients` | Client UI (admin) | list, details, calibration panel |
| `access` | Access UI | user access, invite management |

---

## Questions?

If you're unsure about:
- Which module a feature belongs to → Check the existing structure or ask
- How to name a feature → Use action-oriented, kebab-case names
- What to document → Follow the template, mark unknowns

---

*Last updated: January 2026*

