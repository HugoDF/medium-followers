const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

function logToRedis(value) {
  const date = new Date;
  client.lpush('dataPoints', JSON.stringify({ value, date }), (err, resp) => {
    console.log('Pushed point');
  });
}

module.exports = logToRedis;
