const authenticate = require('./authenticate');
const { authorize, checkPermission } = require('./authorize');
const validate = require('./validate');

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  validate,
};
