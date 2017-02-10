const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

function dumpValues(cb = console.log) {
  client.lrange('dataPoints', [ 0, -1 ], (err, data) => {
    cb(data);
    client.quit();
  });
}

if(require.main === module) {
  dumpValues();
}

module.exports = dumpValues;