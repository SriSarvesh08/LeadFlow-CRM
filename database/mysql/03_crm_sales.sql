
CREATE DATABASE IF NOT EXISTS crm_sales;

USE crm_sales;

-- 1. Products
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    sku VARCHAR(40) UNIQUE,
    price DECIMAL(12,2) NOT NULL,
    gst_rate DECIMAL(4,2) DEFAULT 18.00,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Deals
CREATE TABLE IF NOT EXISTS deals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) DEFAULT 0,
    stage ENUM('prospect','proposal','negotiation','won','lost')
        DEFAULT 'prospect',
    lost_reason VARCHAR(200),
    expected_close DATE,
    owner_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME
);

-- 3. Deal Products
CREATE TABLE IF NOT EXISTS deal_products (
    deal_id INT,
    product_id INT,
    qty INT,
    price DECIMAL(12,2),
    PRIMARY KEY (deal_id, product_id)
);

-- 4. Quotes
CREATE TABLE IF NOT EXISTS quotes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quote_no VARCHAR(20) UNIQUE,
    deal_id INT,
    account_id INT,
    status ENUM('draft','sent','accepted','rejected') DEFAULT 'draft',
    valid_until DATE,
    total DECIMAL(12,2)
);

-- 5. Quote Items
CREATE TABLE IF NOT EXISTS quote_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quote_id INT,
    product_id INT,
    qty INT,
    price DECIMAL(12,2),
    gst_rate DECIMAL(4,2)
);

-- 6. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_no VARCHAR(20) UNIQUE,
    quote_id INT NULL,
    account_id INT NOT NULL,
    issue_date DATE,
    due_date DATE,
    subtotal DECIMAL(12,2),
    gst_amount DECIMAL(12,2),
    total DECIMAL(12,2),
    amount_paid DECIMAL(12,2) DEFAULT 0,
    status ENUM('draft','pending','partially_paid','paid','overdue','cancelled')
        DEFAULT 'draft'
);

-- 7. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT,
    description VARCHAR(200),
    qty INT,
    price DECIMAL(12,2),
    gst_rate DECIMAL(4,2)
);

-- 8. Payments
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    amount DECIMAL(12,2),
    mode ENUM('upi','bank','cheque','cash'),
    reference VARCHAR(60),
    paid_on DATE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- 9. Targets
CREATE TABLE IF NOT EXISTS targets (
    user_id INT,
    month CHAR(7),
    amount DECIMAL(12,2),
    PRIMARY KEY (user_id, month)
);
