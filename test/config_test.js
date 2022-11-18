const config = require('../lib/config')();

console.log(config.get('logging.statsd.enabled'));
