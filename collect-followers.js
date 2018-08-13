const { getFollowersForUser } = require('./medium/get-followers-for-user');
const uuid = require('uuid/v4');
const FollowerCount = require('./models');
const { user } = require('./models');

async function main() {
  const users = await user.all();
  console.log(`Running follower count collection for ${users.length} users`);
  return Promise.all(
    users
      .map((user) => Promise.all([
        getFollowersForUser(user.username),
        FollowerCount.getCurrentFollowerCountForUserId(user.id)
      ]).then(async ([count, currentFollowerCount]) => {
        console.log(count, currentFollowerCount);
        if (count && currentFollowerCount !== count) {
          await FollowerCount.create(uuid(), user.id, count, Date.now());
          console.log('Added new FollowerCount to DB');
        } else {
          console.log('not adding follower count');
        }
      })
        .catch(err => console.error(err))
      )
  );
}

function run() {
  main();
  setInterval(
    main,
    process.env.REFRESH_RATE || 3000
  );

}

if (require.main === module) {
  run();
}

module.exports = {
  run
};
