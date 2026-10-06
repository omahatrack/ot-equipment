OTE Equipment Hub v30

Changes from v29:
- Added manual/invoice Parts Cost field to new service records.
- Added Parts Cost field to Edit Service Record.
- Manual service parts cost is added to inventory-issued parts cost for service totals.
- Equipment maintenance totals and Reports include manual service parts costs.
- Inventory-linked parts remain locked during service edits to preserve inventory transaction history.
- Added migration 007_service_manual_parts_cost.sql.

Deployment:
- Upload the complete project ZIP to GoDaddy.
- Existing startup migration runner automatically applies migration 007 once.
