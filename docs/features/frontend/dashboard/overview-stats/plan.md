# Feature: Overview Stats

## Feature Summary

Dashboard cards displaying key metrics: instrument counts, document status, proposal counts.

## User Value

### Problem Solved
Users need a quick overview of their metrological operations status.

### Who Benefits
- **Quality Managers**: Monitor compliance
- **Staff**: Overview across clients
- **All Users**: Quick status check

## Scope

### In Scope
- Instrument counts (expired, in compliance)
- Document expiration count
- Proposal counts
- Summary statistics

### Out of Scope
- Historical trends
- Detailed breakdowns

## User Flow

### Primary Flow
1. User logs in
2. Dashboard loads
3. Stats cards display current metrics

## Acceptance Criteria

- [ ] Shows instrument statistics
- [ ] Shows document statistics
- [ ] Shows proposal statistics
- [ ] Different data for staff vs client

## Frontend Behavior

### Screens/Components
- `DashboardPage.jsx` — Main page
- Stats card components

### Key States
- **Loading**: Skeleton cards
- **Loaded**: Metrics displayed
- **Error**: Error message

## Data & Permissions

### Entities Touched
- Dashboard API — Read

### Permissions
- **All Authenticated Users**: View own dashboard

## Edge Cases & Failures

### Missing Data
- No client: Show zeros

## Observability

### Logs/Events
- Dashboard loads logged

## Open Questions

- [ ] Should stats refresh automatically?

