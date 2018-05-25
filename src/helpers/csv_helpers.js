const parseCsv = require('csv-parse/lib/index');
const { promisify } = require('util');

module.exports = promisify(parseCsv);
