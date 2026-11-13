const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const services = {
  auth: {
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    name: 'auth-service',
  },
  leads: {
    target: process.env.LEADS_SERVICE_URL || 'http://localhost:5002',
    name: 'leads-service',
  },
  customers: {
    target: process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:5003',
    name: 'customers-service',
  },
  sales: {
    target: process.env.SALES_SERVICE_URL || 'http://localhost:5004',
    name: 'sales-service',
  },
  activity: {
    target: process.env.ACTIVITY_SERVICE_URL || 'http://localhost:5005',
    name: 'activity-service',
  },
  support: {
    target: process.env.SUPPORT_SERVICE_URL || 'http://localhost:5006',
    name: 'support-service',
  },
  notifications: {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5007',
    name: 'notification-service',
  },
};

module.exports = services;

