const axios = require('axios');

const HIJACKING_PREFIX = '])}while(1);</x>';

function getFollowedByCount({ payload } = {}) {
  const { user: { userId } = {} } = payload;
  const {
    references: {
      SocialStats: {
        [ userId ]: {
          usersFollowedByCount = 0
        } = {}
      } = {}
    } = {}
  } = payload;
  return usersFollowedByCount;
}

function getFollowersForUser(username) {
  return axios(`https://medium.com/@${username}?format=json`)
    .then( ({ data }) => data.replace(HIJACKING_PREFIX, '') )
    .then( JSON.parse )
    .then( getFollowedByCount )
    .catch( err => console.error(err));
}

module.exports = getFollowersForUser;
