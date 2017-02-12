const { exec } = require('child_process');
const command = `heroku config | grep REDIS_URL | cut -f2 -d' '`;
const runGraph = require('./graph');

exec(command, (err, stdout, stderr) => {
  const REDIS_URL = stdout.replace('\n', '');
  runGraph(REDIS_URL);
});
