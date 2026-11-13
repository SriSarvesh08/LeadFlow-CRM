# LeadFlow CRM – Database Relationships

## 1. Database Architecture

The LeadFlow CRM project uses:

- MySQL: 3 databases
- MongoDB: 4 databases

Each microservice owns its database. Cross-service relationships use IDs instead of cross-database foreign keys.

## 2. MySQL Databases

### A. crm_auth

Tables:
- roles
- permissions
- role_permissions
- users
- refresh_tokens
- audit_logs
- settings

Relationships:
- users.role_id → roles.id
- role_permissions.role_id → roles.id
- role_permissions.permission_id → permissions.id
- refresh_tokens.user_id → users.id

### B. crm_customers

Tables:
- accounts
- contacts

Relationships:
- contacts.account_id → accounts.id

### C. crm_sales

Tables:
- products
- deals
- deal_products
- quotes
- quote_items
- invoices
- invoice_items
- payments
- targets

Relationships:
- deal_products.deal_id → deals.id
- deal_products.product_id → products.id
- quotes.deal_id → deals.id
- quote_items.quote_id → quotes.id
- quote_items.product_id → products.id
- invoices.quote_id → quotes.id
- invoice_items.invoice_id → invoices.id
- payments.invoice_id → invoices.id

## 3. Cross-Service ID References

The following are logical references, not database-enforced foreign keys:

- deals.account_id → crm_customers.accounts.id
- deals.owner_user_id → crm_auth.users.id
- quotes.account_id → crm_customers.accounts.id
- invoices.account_id → crm_customers.accounts.id
- targets.user_id → crm_auth.users.id
- accounts.owner_user_id → crm_auth.users.id

MongoDB documents also use IDs to reference records owned by other services.

## 4. MongoDB Databases

### A. crm_leads
- leads
- lead_sources
- scoring_rules

### B. crm_activity
- activities
- meetings
- notes
- tasks

### C. crm_support
- tickets
- sla_rules

### D. crm_notify
- notifications
- preferences

MongoDB collections use document IDs and application-managed references rather than relational foreign-key constraints.

## 5. Database Design Rules

1. Every MySQL table has a primary key.
2. Related tables within the same database use foreign keys where configured.
3. Cross-service relationships use IDs.
4. Monetary values use DECIMAL data types.
5. Passwords are stored as bcrypt hashes.
6. Dates and timestamps follow the project's UTC storage convention.
7. Seed data is provided for development and testing.

## 6. Verification Summary

| Database | Tables / Collections |
|---|---:|
| crm_auth | 7 |
| crm_customers | 2 |
| crm_sales | 9 |
| crm_leads | 3 |
| crm_activity | 4 |
| crm_support | 2 |
| crm_notify | 2 |

Total:
- 18 MySQL tables
- 11 MongoDB collections
- 13 configured MySQL foreign-key constraints

Document purpose: Week 1 database architecture and relationship documentation.