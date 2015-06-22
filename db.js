var config = require('./config.json');
var pmongo = require('promised-mongo');
module.exports = pmongo(config.dbName);
