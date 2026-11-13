const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const router = express.Router();

/**
 * Helper to build proxy options with user header injection and error handling
 * @param {string} targetUrl - Microservice target URL (e.g., http://localhost:5001)
 * @param {string} serviceName - Friendly service identifier
 * @param {object} pathRewrite - Path rewrite mapping
 */
const buildProxy = (targetUrl, serviceName, pathRewrite = {}) => {
  const rewriteFn = (path, req) => {
    if (typeof pathRewrite === 'function') {
      return pathRewrite(path, req);
    }
    const originalPath = req.originalUrl || path;
    if (pathRewrite && typeof pathRewrite === 'object' && Object.keys(pathRewrite).length > 0) {
      for (const [pattern, replacement] of Object.entries(pathRewrite)) {
        const regex = new RegExp(pattern);
        if (regex.test(originalPath)) {
          return originalPath.replace(regex, replacement);
        }
      }
      return originalPath;
    }
    return originalPath.replace(/^\/api/, '') || '/';
  };

  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: rewriteFn,
    on: {
      proxyReq: (proxyReq, req) => {
        // Pass authenticated user context headers downstream
        if (req.user) {
          proxyReq.setHeader('x-user-id', String(req.user.id || ''));
          proxyReq.setHeader('x-user-email', req.user.email || '');
          proxyReq.setHeader('x-user-role', req.user.role || '');
          if (Array.isArray(req.user.permissions)) {
            proxyReq.setHeader('x-user-permissions', JSON.stringify(req.user.permissions));
          }
        }

        // Restream request body for POST/PUT/PATCH requests if parsed by express.json()
        if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
      error: (err, req, res) => {
        console.error(`[api-gateway] Error proxying to ${serviceName}:`, err.message);
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: `Service '${serviceName}' is currently unreachable. Please try again shortly.`,
            error: err.code || err.message,
          });
        }
      },
    },
  });
};

// -------------------------------------------------------------
// 1. Auth Service (Port 5001)
// Routes: /api/auth/*, /api/users/*, /api/roles/*, /api/audit-logs/*, /api/settings/*
// -------------------------------------------------------------
router.use('/auth', buildProxy(services.auth.target, 'auth-service', { '^/api/auth': '/auth' }));
router.use('/users', buildProxy(services.auth.target, 'auth-service', { '^/api/users': '/users' }));
router.use('/roles', buildProxy(services.auth.target, 'auth-service', { '^/api/roles': '/roles' }));
router.use('/audit-logs', buildProxy(services.auth.target, 'auth-service', { '^/api/audit-logs': '/audit-logs' }));
router.use('/settings', buildProxy(services.auth.target, 'auth-service', { '^/api/settings': '/settings' }));

// -------------------------------------------------------------
// 2. Leads Service (Port 5002)
// Routes: /api/leads/*, /api/public/lead-form
// -------------------------------------------------------------
router.use('/leads', buildProxy(services.leads.target, 'leads-service', { '^/api/leads': '/leads' }));
router.use('/public/lead-form', buildProxy(services.leads.target, 'leads-service', { '^/api/public/lead-form': '/public/lead-form' }));

// -------------------------------------------------------------
// 3. Customers Service (Port 5003)
// Routes: /api/accounts/*, /api/contacts/*
// -------------------------------------------------------------
router.use('/accounts', buildProxy(services.customers.target, 'customers-service', { '^/api/accounts': '/accounts' }));
router.use('/contacts', buildProxy(services.customers.target, 'customers-service', { '^/api/contacts': '/contacts' }));

// -------------------------------------------------------------
// 4. Sales Service (Port 5004)
// Routes: /api/deals/*, /api/products/*, /api/quotes/*, /api/invoices/*, /api/targets/*
// -------------------------------------------------------------
router.use('/deals', buildProxy(services.sales.target, 'sales-service', { '^/api/deals': '/deals' }));
router.use('/products', buildProxy(services.sales.target, 'sales-service', { '^/api/products': '/products' }));
router.use('/quotes', buildProxy(services.sales.target, 'sales-service', { '^/api/quotes': '/quotes' }));
router.use('/invoices', buildProxy(services.sales.target, 'sales-service', { '^/api/invoices': '/invoices' }));
router.use('/targets', buildProxy(services.sales.target, 'sales-service', { '^/api/targets': '/targets' }));

// -------------------------------------------------------------
// 5. Activity Service (Port 5005)
// Routes: /api/tasks/*, /api/calendar/*, /api/notes/*, /api/activities/*
// -------------------------------------------------------------
router.use('/tasks', buildProxy(services.activity.target, 'activity-service', { '^/api/tasks': '/tasks' }));
router.use('/calendar', buildProxy(services.activity.target, 'activity-service', { '^/api/calendar': '/calendar' }));
router.use('/notes', buildProxy(services.activity.target, 'activity-service', { '^/api/notes': '/notes' }));
router.use('/activities', buildProxy(services.activity.target, 'activity-service', { '^/api/activities': '/activities' }));

// -------------------------------------------------------------
// 6. Support Service (Port 5006)
// Routes: /api/tickets/*
// -------------------------------------------------------------
router.use('/tickets', buildProxy(services.support.target, 'support-service', { '^/api/tickets': '/tickets' }));

// -------------------------------------------------------------
// 7. Notification Service (Port 5007)
// Routes: /api/notifications/*, /api/preferences/*
// -------------------------------------------------------------
router.use('/notifications', buildProxy(services.notifications.target, 'notification-service', { '^/api/notifications': '/notifications' }));
router.use('/preferences', buildProxy(services.notifications.target, 'notification-service', { '^/api/preferences': '/preferences' }));

module.exports = router;
