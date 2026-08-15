## Billing & Licensing UX

Status: Proposed implementation blueprint for Package 9 (Billing & Licensing).

This document operationalises UX_VISION.md and LICENSING_MODEL_V1.md.

### Purpose
Provide a clear UX blueprint for billing, licensing, renewals, approvals, and licence lifecycle management.

### Navigation
Administration > Billing & Licensing

Sections:
- Overview
- Licence Details
- Usage & Capacity
- Renewals
- Requests
- Approval History

### Overview Dashboard
Display:
- Tier
- Hosting Model
- Licence Status
- Expiry Date
- Capacity Usage
- Recent Events
- Next Required Action

### Licence Details
Read-only view of all entitlements and licence metadata.

### Usage & Capacity
Show consumption and remaining allocation for:
- Workers
- Users
- Organisations

### Renewal Wizard
1. Review Current Licence
2. Select Renewal Type
3. Review Summary
4. Submit Request

### Worker Pack Wizard
1. Select Pack Size
2. Review Capacity Change
3. Submit Approval Request

### Ownership Transfer Wizard
1. Current Ownership
2. New Ownership
3. Transfer Reason
4. Review
5. Submit

### Grace Period Experience
Show licence expiry, remaining grace period, and renewal actions.

### Locked Mode Experience
Only licensing functions remain available until a valid licence is installed.

### Natural Language Future State
Examples:
- Show my licence status
- Start a renewal request
- Request additional workers
- Show ownership transfer history

### Success Criteria
An administrator can:
- Understand licence status
- Understand capacity
- Request renewal
- Request additional workers
- Track approvals
without external assistance.
