const { base, MEDIUMLYTICS_FOLLOWER_COUNT, MEDIUMLYTICS_USERS } = require('./base');

const { dbPromise } = require('../db/connect');

const followerCountBase = base(MEDIUMLYTICS_FOLLOWER_COUNT);
const usersBase = base(MEDIUMLYTICS_USERS);

async function getCurrentFollowerCountForUserId(userId) {
  try {
    const [latestFollowerCount] = await followerCountBase.select({
      filterByFormula: `userId = '${userId}'`,
      sort: [{
        field: 'createdAt',
        direction: 'desc'
      }],
      maxRecords: 1
    }).firstPage();
    return latestFollowerCount.fields.number;
  } catch (err) {
    console.error(err);
  }
}

async function getAirtableIdForUserId(userId) {
  try {
    const [user] = await usersBase.select({
      filterByFormula: `id = '${userId}'`,
      maxRecords: 1
    }).firstPage();
    return user.id;
  } catch (err) {
    console.error(err);
  }
}


function create(id, userId, number, createdAt) {
  return Promise.all([
    dbPromise.then(
      db => db.run(
        `INSERT INTO FollowerCount (id, userId, number, createdAt)
          VALUES (?, ?, ?, ?)
        `,
        id, userId, number, createdAt
      )
    ),
    getAirtableIdForUserId(userId).then(airtableUserId =>
      followerCountBase.create({
        id, userId: [airtableUserId], number, createdAt
      })
    )
  ]);
}

module.exports = {
  getCurrentFollowerCountForUserId,
  create
}
