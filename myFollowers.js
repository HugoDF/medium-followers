const getFollowersForUser = require('./medium/getFollowersForUser');
const logToRedis = require('./db/logToRedis');

let username = 'hugo__df';

function main() {
  getFollowersForUser(username)
    .then( (count) => {
      console.log(count);
      logToRedis(count);
    })
    .catch( err => console.error(err) );
}

main();

setInterval(
  main,
  60000
);
