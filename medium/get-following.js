const axios = require('axios');
const makeQueryString = require('../lib/make-query-string');

const remove = '])}while(1);</x>';

const PAGE_LIMIT = 20;

async function getNextPageUserNames(url, pageLimit) {
  try {
    const rawString = (await axios.get(url)).data;
    const JSONString = rawString.replace(remove, '');
    const data = JSON.parse(JSONString);
    const followingIds  = data.payload.streamItems.filter(item => item.itemType === 'userPreview').map(item => item.userPreview.userId);
    const userIdToUserMap = data.payload.references.User;
    const followingUsers = followingIds.map(id => userIdToUserMap[id]);
    const followingUserNames = followingUsers.map(user => user.username);
    const paging = data.payload.paging;
    const { limit, to, page, source } = paging.next;
    console.log({limit, to, page, source});
    if (page + 1 >= pageLimit) {
      return followingUserNames;
    }
    const nextPageUrl = paging.path + '?' + makeQueryString({ limit, to, page, source });
    return [...followingUserNames, ...(await getNextPageUserNames(nextPageUrl, pageLimit))]
  } catch (err) {
    console.error(err.stack);
    return [];
  }
}

async function getFollowing (username, pageLimit = PAGE_LIMIT) {
  const url = `https://medium.com/${username}/following`;
  return await getNextPageUserNames(url, pageLimit);
}

module.exports = {
  getFollowing
};
