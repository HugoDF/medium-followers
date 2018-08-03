const express = require('express');
const exphbs  = require('express-handlebars');

const { user, getCurrentFollowerCountForUserId } = require('./models');
const axios = require('axios');
const app = express();

const sessions = require('client-sessions');
const bodyParser = require('body-parser');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// app.use('/static', express.static('.data'));
app.use(bodyParser.json());

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
  if(!req.auth || !req.auth.id) {
    res.redirect('/');
  }
  const currentFollowers = await getCurrentFollowerCountForUserId(req.auth.id);
  res.render('dashboard', {
    currentFollowers
  });
});

const { getFollowing } = require('./following');
const { getFollowersForUser } = require('./medium/get-followers-for-user');

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
  return res.json({
    userFollowerCount,
    following: followingWithFollowerCount
  });
});

const makeQueryString = require('./lib/make-query-string');

const MEDIUM_BASE_URL = 'https://api.medium.com/v1';

app.get('/medium-oauth/callback', async (req, res) => {
  const { state, code, error} = req.query;

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
    const activeUser = await user.getById(id);
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
