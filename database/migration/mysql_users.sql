-- LeadFlow CRM
-- Docker MySQL application users
-- Replace placeholders with secure passwords before execution.

CREATE USER IF NOT EXISTS 'crm_auth_app'@'%'
IDENTIFIED BY 'REPLACE_WITH_AUTH_PASSWORD';

CREATE USER IF NOT EXISTS 'crm_customers_app'@'%'
IDENTIFIED BY 'REPLACE_WITH_CUSTOMERS_PASSWORD';

CREATE USER IF NOT EXISTS 'crm_sales_app'@'%'
IDENTIFIED BY 'REPLACE_WITH_SALES_PASSWORD';

GRANT SELECT, INSERT, UPDATE, DELETE
ON crm_auth.* TO 'crm_auth_app'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE
ON crm_customers.* TO 'crm_customers_app'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE
ON crm_sales.* TO 'crm_sales_app'@'%';
