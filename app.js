const express = require('express');
const exphbs = require('express-handlebars');

const { user, getCurrentFollowerCountForUserId } = require('./models');
const axios = require('axios');
const app = express();

const sessions = require('client-sessions');
const bodyParser = require('body-parser');
const morgan = require('morgan');

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  partialsDir: __dirname + '/views/partials'
}));

app.set('view engine', 'handlebars');

app.use('/public', express.static('./static'));

// app.use('/static', express.static('.data'));
app.use(bodyParser.json());
app.use(morgan('dev'));

app.use(sessions({
  cookieName: 'auth', // cookie name dictates the key name added to the request object
  secret: process.env.SESSION_SECRET,
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5
}));

const baseData = (req) => ({
  isAuthed: Boolean(req.auth && req.auth.id),
  auth: req.auth,
});

app.get('/', (req, res) => {
  res.render('landing', baseData(req));
});

app.get('/dashboard', async (req, res) => {
  if (!req.auth || !req.auth.id) {
    res.redirect('/');
  }
  const currentFollowers = await getCurrentFollowerCountForUserId(req.auth.id);
  res.render('dashboard', {
    currentFollowers
  });
});

const { getFollowing } = require('./medium/get-following');
const { getFollowersForUser } = require('./medium/get-followers-for-user');

const uuidv4 = require('uuid/v4');

const createIfNew = async name => {
  const exists = await user.getByUsername(name);
  if (!exists) {
    user.create(uuidv4(), name)
  }
}

app.get('/api/current-following-follower-count', async (req, res) => {
  if (!req.auth || !req.auth.id) {
    return res.sendStatus(401);
  }
  const fullUser = await user.getById(req.auth.id);
  const username = fullUser.get('username');
  const following = await getFollowing(`@${username}`, 1);
  const followingWithFollowerCount = await Promise.all(following.map(async user => ({
    user: user,
    followers: await getFollowersForUser(user)
  })))

  Promise.all(
    following.map(
      name => createIfNew(name)
    )
  ).then(() => console.log('created some more users'));

  return res.json({
    following: followingWithFollowerCount
  });
});

app.post('/api/following-follower-count', async (req, res) => {
  const { username } = req.body;
  const [userFollowerCount, following] = await Promise.all([
    getFollowersForUser(username),
    getFollowing(username, 2)
  ]);
  const followingWithFollowerCount = await Promise.all(following.map(async user => ({
    user: user,
    followers: await getFollowersForUser(user)
  })));
  const createUsers = Promise.all([
    // proper usernames don't have @
    createIfNew(username.replace('@', '')),
    following.map(name => createIfNew(name))
  ]);
  createUsers.then(() => console.log('created some users'));
  return res.json({
    userFollowerCount,
    following: followingWithFollowerCount
  });
});

const makeQueryString = require('./lib/make-query-string');

const MEDIUM_BASE_URL = 'https://api.medium.com/v1';

app.get('/medium-oauth/callback', async (req, res) => {
  const { state, code, error } = req.query;

  if (!error && state === process.env.MEDIUM_SECRET) {
    const postContent = {
      code,
      client_id: process.env.MEDIUM_CLIENT_ID,
      client_secret: process.env.MEDIUM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.MEDIUM_REDIRECT_URI
    };

    const resp = await axios.post(MEDIUM_BASE_URL + '/tokens', makeQueryString(postContent));
    const { access_token, refresh_token } = resp.data;
    const userResp = (await axios.get(
      MEDIUM_BASE_URL + '/me',
      { headers: { Authorization: `Bearer ${access_token}` } }
    )).data;
    const { id, username, name, url, imageUrl } = userResp.data;
    const activeUser = await user.getByUsername(id);
    if (!activeUser) {
      await user.create(id, username, url, imageUrl, access_token);
    } else {
      await user.update(activeUser.id, username, url, imageUrl, access_token);
    }
    req.auth = {
      id, username, name, url, imageUrl
    };
    res.redirect('/dashboard');
  }
});

app.get('/login/medium', (req, res) => {
  const OAUTH_BASE_URL = 'https://medium.com/m/oauth/authorize?';
  const oAuthQueryString = makeQueryString({
    client_id: process.env.MEDIUM_CLIENT_ID,
    scope: 'basicProfile',
    state: process.env.MEDIUM_SECRET,
    response_type: 'code',
    redirect_uri: process.env.MEDIUM_REDIRECT_URI
  });
  const mediumLoginUrl = OAUTH_BASE_URL + oAuthQueryString;
  res.redirect(mediumLoginUrl);
});

app.get('/logout', (req, res) => {
  req.auth.destroy();
  res.redirect('/');
});

module.exports = app;
