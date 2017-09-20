const { exec } = require('child_process');
const command = `heroku config:get REDIS_URL -a medium-stats | cut -f2 -d' '`;
const runGraph = require('./graph');

exec(command, (err, stdout, stderr) => {
  const REDIS_URL = stdout.replace('\n', '');
  runGraph(REDIS_URL);
});
