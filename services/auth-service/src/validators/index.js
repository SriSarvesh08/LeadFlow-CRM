const authValidators = require('./authValidators');
const userValidators = require('./userValidators');

module.exports = {
  ...authValidators,
  ...userValidators,
};
