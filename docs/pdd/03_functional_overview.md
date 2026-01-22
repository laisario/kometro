# Functional Overview

This document describes the core functionalities of KOMETROgo from a user perspective, outlining what the system enables users to accomplish.

---

## Overview of Core Functionalities

KOMETROgo is organized into five major functional areas:

1. **Instrument Management** — Track, organize, and monitor measuring instruments
2. **Calibration Lifecycle** — Manage calibrations from scheduling to certificate storage
3. **Document Control** — Handle controlled documents with versioning and approvals
4. **Commercial Proposals** — Generate and manage service quotations
5. **Client Administration** — Manage organizations, users, and access

---

## Major System Capabilities

### 1. Instrument Management

Users can maintain a complete registry of all measuring instruments within their organization.

**What users can do:**

- Register new instrument types with specifications (range, resolution, manufacturer, model)
- Create instrument instances with unique tags and serial numbers
- Assign instruments to sectors or departments for organizational tracking
- Set calibration and verification frequencies (daily, monthly, annually)
- Choose frequency criteria: calendar-based (fixed intervals) or service-time-based (usage hours)
- Track instrument position: In Use, In Stock, Inactive, Out of Service, In Calibration
- View complete movement history showing position changes over time
- Define acceptance criteria with tolerance values and reference standards
- Associate instruments with applicable normative standards
- Import instruments in bulk from spreadsheet files
- Search and filter instruments by tag, type, sector, status, or expiration date

### 2. Calibration Lifecycle

Users can manage the entire calibration process from scheduling through result analysis.

**What users can do:**

- View upcoming calibrations in list format
- See instruments approaching expiration (30 days, 15 days, expired)
- Record calibration events with dates, service orders, and performing laboratory
- Enter calibration results including largest error and uncertainty values
- Evaluate results against acceptance criteria (automatic pass/fail determination)
- Perform critical analysis: Approved, Rejected, or Approved with Restrictions
- Upload calibration certificates and supporting attachments
- Track verification (intermediate checks) between formal calibrations
- View complete calibration history for any instrument
- Receive automatic email notifications before calibration due dates
- Record calibration pricing for historical cost tracking

### 3. Document Control

Users can manage controlled documents with full versioning and approval workflows.

**What users can do:**

- Create and upload new controlled documents (procedures, instructions, policies)
- Assign document codes following organizational conventions
- Set document validity periods and review frequencies
- Track document status: Valid, Obsolete, or Cancelled
- Initiate document revisions (updates) or revalidations (extensions)
- Define required approvers for each revision
- Approve or reject pending revisions assigned to them
- View revision history with change descriptions
- Download current or historical document versions
- Receive notifications when documents require review
- Manage external reference documents (standards, regulations)
- Search documents by code, title, status, or validity date

### 4. Commercial Proposals

Users can create, manage, and distribute calibration service quotations.

**What users can do:**

- Create new proposals for existing clients
- Add instruments to proposals from the client's registered inventory
- Select calibration location: laboratory or client site
- View automatic price calculations based on instrument types and location
- Apply percentage discounts to proposal totals
- Specify payment terms and business day estimates
- Add delivery addresses and transport information
- Include additional notes and special conditions
- Generate professional PDF proposals with company branding
- Send proposals via email directly from the system
- Track proposal status: Draft, Awaiting Approval, Approved, Rejected
- Create proposal revisions when changes are needed
- Upload supporting attachments to proposals
- View proposal history and approval dates
- Mark proposals as completed when services are delivered

### 5. Client Administration

Administrators can manage organizational settings, users, and access controls.

**What users can do:**

- Register companies with legal information (business name, tax ID)
- Create sectors and sub-sectors reflecting organizational structure
- Invite new users via secure email links
- Assign users to permission groups (roles)
- Manage user access to specific client organizations
- Configure default calibration frequency criteria for the organization
- Define instrument base catalogs available to the client
- View aggregated statistics: total instruments, overdue count, pending proposals
- Manage addresses for delivery and billing purposes

### 6. Dashboard and Reporting

Users can monitor their metrological operations through visual dashboards.

**What users can do:**

- View summary cards showing key metrics at a glance
- See instrument distribution by status (in compliance, expiring, expired)
- Monitor document validity status
- Track pending proposal approvals
- Identify instruments requiring immediate attention
- Filter dashboard views by sector or time period

---

## Functional Scope

### In Scope

| Area | Included Functionality |
|------|----------------------|
| **Instruments** | Registration, tracking, status management, history, bulk import |
| **Calibrations** | Scheduling, recording, result entry, certificate storage, alerts |
| **Verifications** | Intermediate checks between calibrations |
| **Documents** | Upload, versioning, approval workflows, notifications |
| **Proposals** | Creation, pricing, PDF generation, email distribution |
| **Users** | Registration, authentication, role-based access |
| **Notifications** | Email alerts for calibrations, documents, approvals |
| **Sectors** | Hierarchical organization of instruments |
| **Reporting** | Dashboard metrics and status summaries |

### Out of Scope

| Area | Excluded Functionality |
|------|----------------------|
| **Calibration Execution** | Performing actual measurements or calculations |
| **Uncertainty Calculations** | Computing measurement uncertainty budgets |
| **Laboratory Workflow** | Sample management, test queues, result entry workflows |
| **Financial Operations** | Invoicing, payment processing, accounts receivable |
| **Inventory/Procurement** | Purchasing, stock levels, reordering |
| **Maintenance Management** | Preventive maintenance, repair tracking |
| **IoT Integration** | Real-time data collection from instruments |
| **Mobile Applications** | Native iOS or Android applications |
| **Offline Mode** | System requires internet connectivity |
| **Multi-Language** | Interface is Portuguese only |

---

## User Workflows

### Typical Instrument Onboarding Flow

1. Administrator creates sectors to organize instruments
2. User registers instrument types with specifications
3. User creates instrument instances with tags and serial numbers
4. User sets calibration frequencies and acceptance criteria
5. System calculates initial calibration due dates

### Typical Calibration Flow

1. System sends notification that calibration is due
2. User updates instrument position to "In Calibration"
3. Instrument is calibrated (externally or internally)
4. User records calibration with results and uploads certificate
5. User performs critical analysis (approve/reject)
6. System calculates next calibration due date
7. User updates instrument position back to "In Use"

### Typical Document Review Flow

1. System sends notification that document review is due
2. Reviewer opens document and evaluates content
3. Reviewer creates revision (update) or revalidation (extension)
4. System notifies designated approvers
5. Approvers review and approve/reject
6. System updates document validity upon all approvals

### Typical Proposal Flow

1. Commercial user creates new proposal for client
2. User selects instruments requiring calibration
3. System calculates pricing based on instrument catalog
4. User adds terms, discounts, and notes
5. User generates PDF and sends to client
6. Client approves or requests changes
7. User updates proposal status
8. Upon completion, user marks proposal as fulfilled


