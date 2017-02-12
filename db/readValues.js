const redis = require('redis');

function dumpValues(cb = console.log, { range = [ 0, -1 ], key = 'dataPoints', REDIS_URL = process.env.REDIS_URL} = {}) {
  const client = redis.createClient(REDIS_URL);
  client.lrange(key, range, (err, data) => {
    cb(data);
    client.quit();
  });
}

if(require.main === module) {
  dumpValues();
}

module.exports = dumpValues;