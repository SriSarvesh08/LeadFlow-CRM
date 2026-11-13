
// LeadFlow CRM - MongoDB Indexes

// 1. crm_leads database
db = db.getSiblingDB("crm_leads");

db.leads.createIndex({ status: 1 });
db.leads.createIndex({ assignedTo: 1 });


// 2. crm_activity database
db = db.getSiblingDB("crm_activity");

db.tasks.createIndex({ assignedTo: 1, dueDate: 1 });


// 3. crm_support database
db = db.getSiblingDB("crm_support");

db.tickets.createIndex({ status: 1, priority: 1 });
