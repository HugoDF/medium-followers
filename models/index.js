const { base, MEDIUMLYTICS_FOLLOWER_COUNT, MEDIUMLYTICS_USERS } = require('./base');

const followerCountBase = base(MEDIUMLYTICS_FOLLOWER_COUNT);
const usersBase = base(MEDIUMLYTICS_USERS);


function fetchAllRecords(baseSelectQuery) {
  let allRecords = [];
  let pageCount = 0;
  const tableName = baseSelectQuery._table.name;
  return new Promise((resolve, reject) =>
    baseSelectQuery.eachPage((pageRecords, fetchNextPage) => {
      pageCount++;
      console.log(`Fetched page ${pageCount} for ${tableName}`);
      allRecords = allRecords.concat(pageRecords);
      fetchNextPage();
    }, err => (err ? reject(err) : resolve(allRecords)))
  );
}

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

async function getAllUsers() {
  return (await fetchAllRecords(
    usersBase.select({})
  )).map(
    (user) => ({ username: user.get('username'), id: user.get('id') })
  );
}
function createUser(id, username, url, imageUrl, accessToken) {
  return usersBase.create({
    id, username, url, imageUrl, accessToken
  });
}

async function getUserById(userId) {
  try {
    const [user] = await usersBase.select({
      filterByFormula: `id = '${userId}'`,
      maxRecords: 1
    }).firstPage();
    return user;
  } catch (err) {
    console.error(err);
  }
}

function updateUser(airtableUserId, username, url, imageUrl, accessToken) {
  return usersBase.update(airtableUserId, {
    username, url, imageUrl, accessToken
  });
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
  return getAirtableIdForUserId(userId)
  .then(airtableUserId =>
    followerCountBase.create({
      id, userId: [airtableUserId], number, createdAt
    })
  );
}

module.exports = {
  user: {
    all: getAllUsers,
    create: createUser,
    getById: getUserById,
    update: updateUser
  },
  getCurrentFollowerCountForUserId,
  create
}
