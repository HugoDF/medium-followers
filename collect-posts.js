const { Post, user } = require('./models');
const { getPosts } = require('./medium/get-posts');

const createIfNew = async (currentPostUrls, post, userId) => {
  const exists = currentPostUrls.includes(post.url);
  if (!exists) {
    return Post.create(post.url, userId, post.publishDate, post.title);
  }
}
async function main() {
  const users = await user.all();
  const currentPosts = await Post.all();
  const currentPostUrls = currentPosts.map(({ url }) => url);
  console.log(`Running post collection for ${users.length} users`);
  return Promise.all(
    users
      .map(async (user) => {
        const posts = await getPosts(user.username);
        return Promise.all(posts.map(post => createIfNew(currentPostUrls, post, user.id)));
      })
  ).catch(err => console.error(err));
}

function run() {
  main();
  // setInterval(
  //   main,
  //   process.env.REFRESH_RATE || 3000
  // );

}

if (require.main === module) {
  run();
}

module.exports = {
  run
};
