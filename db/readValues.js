const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

function dumpValues(cb = console.log, { range = [ 0, -1 ], key = 'dataPoints'} = {}) {
  client.lrange(key, range, (err, data) => {
    cb(data);
    client.quit();
  });
}

if(require.main === module) {
  dumpValues();
}

module.exports = dumpValues;