# LeadFlow CRM – MySQL Migration Mapping

## 1. Migration source and target

- Source: Local Windows MySQL 8.0.46
- Target: Docker MySQL 8.4
- Migration method: SQL backup import
- Existing local databases must remain unchanged.

## 2. Database mapping

### crm_auth

**Backup file:** `database/backup/crm_auth_backup.sql`

Expected tables:

| Table |
|---|
| roles |
| permissions |
| role_permissions |
| users |
| refresh_tokens |
| audit_logs |
| settings |

Expected table count: 7

### crm_customers

**Backup file:** `database/backup/crm_customers_backup.sql`

Expected tables:

| Table |
|---|
| accounts |
| contacts |

Expected table count: 2

### crm_sales

**Backup file:** `database/backup/crm_sales_backup.sql`

Expected tables:

| Table |
|---|
| products |
| deals |
| deal_products |
| quotes |
| quote_items |
| invoices |
| invoice_items |
| payments |
| targets |

Expected table count: 9

## 3. Migration summary

| Item | Expected count |
|---|---:|
| Databases | 3 |
| Tables | 18 |
| Backup files | 3 |

## 4. Application users and permissions

| Application user | Database | Permissions |
|---|---|---|
| crm_auth_app | crm_auth | SELECT, INSERT, UPDATE, DELETE |
| crm_customers_app | crm_customers | SELECT, INSERT, UPDATE, DELETE |
| crm_sales_app | crm_sales | SELECT, INSERT, UPDATE, DELETE |

Each application user must have access only to its assigned database.

## 5. Required MySQL indexes

| Database | Table | Index |
|---|---|---|
| crm_sales | invoices | status |
| crm_sales | deals | stage |

Index definitions are maintained in `database/mysql/04_indexes.sql`.

## 6. Migration verification

After importing into Docker MySQL:

1. Verify all three databases exist.
2. Verify all 18 expected tables exist.
3. Compare table record counts with the source databases.
4. Verify the required indexes.
5. Verify application-user permissions.
6. Test database connectivity from the backend services.

**Important:** These are expected schema mappings. Verify the actual Docker schemas and table counts against the source backups before declaring migration complete. Do not overwrite existing Docker data or volumes.