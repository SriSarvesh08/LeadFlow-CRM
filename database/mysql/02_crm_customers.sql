CREATE DATABASE IF NOT EXISTS crm_customers;

USE crm_customers;

CREATE TABLE IF NOT EXISTS accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    industry VARCHAR(60),
    gstin VARCHAR(15),
    phone VARCHAR(20),
    website VARCHAR(150),
    city VARCHAR(60),
    state VARCHAR(60),
    owner_user_id INT NOT NULL,
    source_lead_id VARCHAR(24),
    last_activity_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(80),
    email VARCHAR(150),
    phone VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE CASCADE
);