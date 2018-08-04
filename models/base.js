const base = require('airtable').base(process.env.AIRTABLE_BASE);

const MEDIUMLYTICS_USERS = 'users';
const MEDIUMLYTICS_FOLLOWER_COUNT = 'followerCount';
const MEDIUMLYTICS_POSTS = 'posts';

module.exports = {
  base,
  MEDIUMLYTICS_USERS,
  MEDIUMLYTICS_FOLLOWER_COUNT,
  MEDIUMLYTICS_POSTS
};
