const Parser = require('rss-parser');
const parser = new Parser();
const parse = require('date-fns/parse');

async function getPosts(username) {
  const url = `https://medium.com/feed/@${username}`;
  const { items = [] } = await parser.parseURL(url);
  return items.map(({ title, link, pubDate }) => ({
    title,
    url: link,
    publishDate: parse(pubDate).getTime()
  }));
}

module.exports = {
  getPosts
};
