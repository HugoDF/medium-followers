const { getFollowersForUser } = require('./medium/getFollowersForUser');
const { dbPromise } = require('./db/connect');
const uuid = require('uuid/v4');

async function main() {
  const db = await dbPromise;
  const users = await db.all('SELECT username, id FROM Users');
  console.log(`Running follower count collection for ${users.length} users`);
  return Promise.all(
    users
     .map((user) =>
          getFollowersForUser(user.username)
          .then(async (count) => {
            const { number: currentFollowerCount } = await db.get('SELECT number FROM FollowerCount ORDER BY createdAt DESC');
            if (currentFollowerCount !== count) {
              await db.run(
                `INSERT INTO FollowerCount (id, userId, number, createdAt)
                  VALUES (?, ?, ?, ?)
                `,
                uuid(), user.id, count, Date.now()
              );
              console.log('Added new FollowerCount to DB');
            }
          })
          .catch( err => console.error(err) )
      )
  );
}

function run() {
  main();
  setInterval(
    main,
    process.env.REFRESH_RATE
  );

}

if (require.main === module) {
  run();
}

module.exports = {
  run
};