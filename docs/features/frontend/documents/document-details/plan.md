# Feature: Document Details

## Feature Summary

Displays document information with file preview, revision history, and approval status for the current revision.

## User Value

### Problem Solved
Users need to view document content and track review/approval status.

### Who Benefits
- **Document Control Specialists**: Manage revisions
- **Approvers**: Review and approve
- **All Users**: Access current documents

## Scope

### In Scope
- Document metadata display
- File preview/download
- Current revision details
- Approval status
- Actions (approve, revise)

### Out of Scope
- Inline editing
- Document comparison

## User Flow

### Primary Flow
1. User clicks document from list
2. System loads document with preview
3. User views information
4. User takes action if needed

## Acceptance Criteria

- [ ] Shows document metadata
- [ ] Displays file preview (PDF, images)
- [ ] Shows revision information
- [ ] Shows approval progress
- [ ] Appropriate action buttons

## Frontend Behavior

### Screens/Components
- `DocumentDetailPage.jsx` — Main page
- `DocViewer.jsx` — File preview
- `InformationCard.jsx` — Metadata
- `ReviewCard.jsx` — Revision details

### Key States
- **Loading**: Skeleton
- **Loaded**: Full display
- **Previewing**: File viewer open

## Data & Permissions

### Entities Touched
- `Documento` — Read
- `Revisao` — Read

### Permissions
- **All Authenticated Users**: View
- **Approvers**: Approve action visible

## Edge Cases & Failures

### Missing Data
- Document not found: 404

## Observability

### Logs/Events
- Document views logged

## Open Questions

- [ ] Should file versions be downloadable?

