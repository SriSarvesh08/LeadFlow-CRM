// LeadFlow CRM
// Docker MongoDB application users
// Replace password placeholders securely before execution.

const leadsDB = db.getSiblingDB("crm_leads");

leadsDB.createUser({
    user: "crm_leads_app",
    pwd: "REPLACE_WITH_LEADS_PASSWORD",
    roles: [{ role: "readWrite", db: "crm_leads" }]
});

const activityDB = db.getSiblingDB("crm_activity");

activityDB.createUser({
    user: "crm_activity_app",
    pwd: "REPLACE_WITH_ACTIVITY_PASSWORD",
    roles: [{ role: "readWrite", db: "crm_activity" }]
});

const supportDB = db.getSiblingDB("crm_support");

supportDB.createUser({
    user: "crm_support_app",
    pwd: "REPLACE_WITH_SUPPORT_PASSWORD",
    roles: [{ role: "readWrite", db: "crm_support" }]
});

const notifyDB = db.getSiblingDB("crm_notify");

notifyDB.createUser({
    user: "crm_notify_app",
    pwd: "REPLACE_WITH_NOTIFICATION_PASSWORD",
    roles: [{ role: "readWrite", db: "crm_notify" }]
});
