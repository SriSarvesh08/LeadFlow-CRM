const cors = require('cors');
const createCorsOptions = require('../../../shared/corsOptions');

module.exports = cors(createCorsOptions());
