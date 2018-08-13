const axios = require('axios');
const makeQueryString = require('../lib/make-query-string');

const remove = '])}while(1);</x>';

const userHasPosted = user => user.lastPostCreatedAt > 0;
const getUsername = user => user.username;

const MAX_MEDIUM_LIMIT = 200;

async function getUsers(
  nextUrl,
  { maxFollowing, interestingUserFn, userMapFn },
  followingUsers
) {
  if (followingUsers.length >= maxFollowing) {
    return followingUsers.slice(0, maxFollowing);
  }
  try {
    const rawString = (await axios.get(nextUrl)).data;
    const JSONString = rawString.replace(remove, '');
    const data = JSON.parse(JSONString);
    const followingIds  = data.payload.streamItems
      .filter(item => item.itemType === 'userPreview')
      .map(item => item.userPreview.userId);
    const userIdToUserMap = data.payload.references.User;
    const pageFollowingUsers = followingIds.map(id => userIdToUserMap[id]).filter(interestingUserFn);
    const paging = data.payload.paging;
    const { to, page, source } = paging.next;
    // Max acceptable limit is 200;
    const limit = Math.min(MAX_MEDIUM_LIMIT, maxFollowing - followingUsers.length)
    const nextPageUrl = paging.path + '?' + makeQueryString({ limit , to, page, source });
    return getUsers(
      nextPageUrl,
      { maxFollowing, interestingUserFn, userMapFn },
      [...followingUsers, ...pageFollowingUsers.map(userMapFn)]
    );
  } catch (error) {
    console.error(error.stack);
  }
}

async function getFollowing (
  {
    username,
    mediumUserId
  } = {},
  {
    maxFollowing = 150, // past the first 2-3 pages it's too slow
    interestingUserFn = () => true,
    userMapFn = getUsername
  } = {}
) {
  const url = mediumUserId
    ? `https://medium.com/_/api/users/${mediumUserId}/profile/stream?limit=${MAX_MEDIUM_LIMIT}&source=following`
    : `https://medium.com/${username}/following`;
  return await getUsers(
    url,
    {
      maxFollowing,
      interestingUserFn,
      userMapFn
    },
    []
  );
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const [ username, mediumUserId, limit = 50 ] = args;
  getFollowing(
    { username, mediumUserId},
    { maxFollowing: limit, interestingUserFn: userHasPosted }
  ).then(data => console.log(new Set(data).size));
}

module.exports = {
  getFollowing
};
