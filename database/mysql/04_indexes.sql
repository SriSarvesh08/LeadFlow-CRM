
-- LeadFlow CRM - Required MySQL Indexes

USE crm_sales;

-- Index for filtering invoices by status
CREATE INDEX idx_invoices_status
ON invoices(status);

-- Index for filtering deals by stage
CREATE INDEX idx_deals_stage
ON deals(stage);