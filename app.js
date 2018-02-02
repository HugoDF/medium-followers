const express = require('express');
const exphbs  = require('express-handlebars');


const axios = require('axios');
const app = express();

const sessions = require('client-sessions');

const { dbPromise } = require('./db/connect');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(sessions({
  cookieName: 'auth', // cookie name dictates the key name added to the request object
  secret: process.env.SESSION_SECRET,
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5
}));

const baseData = (req) => ({
  isAuthed: Boolean(req.auth && req.auth.id),
  auth: req.auth,
  MEDIUM_CLIENT_ID: process.env.MEDIUM_CLIENT_ID,
  MEDIUM_SECRET: process.env.MEDIUM_SECRET,
  MEDIUM_REDIRECT_URI: process.env.MEDIUM_REDIRECT_URI
});

app.get('/', (req, res) => {
  res.render('landing', baseData(req));
});

const addHours = require('date-fns/add_hours');
const addDays = require('date-fns/add_days');

app.get('/dashboard', async (req, res) => {
  if(!req.auth || !req.auth.id) {
    res.redirect('/');
  }
  const db = await dbPromise;
  const {
    number: currentFollowers
  } = await db.get(
    'SELECT number FROM FollowerCount WHERE userId = ? ORDER BY createdAt DESC', req.auth.id
  ) || {};
  const now = Date.now();
  const {
    number: hourlyFollowers = '-'
  } = await db.get(
    'SELECT number FROM FollowerCount WHERE userId = ? AND createdAt < ? ORDER BY createdAt DESC',
    req.auth.id, addHours(now, -1).getTime()
  ) || {};
  const {
    number: dailyFollowers = '-'
  } = await db.get(
    'SELECT number FROM FollowerCount WHERE userId = ? AND createdAt < ? ORDER BY createdAt DESC',
    req.auth.id, addDays(now, -1).getTime()
  ) || {};
  const hourlyIncrease = hourlyFollowers !== '-' && `${currentFollowers - hourlyFollowers}`;
  const dailyIncrease = dailyFollowers !== '-' && `${currentFollowers - dailyFollowers}`;
  res.render('dashboard', {
    ...baseData(req),
    data: {
      currentFollowers,
      hourlyFollowers,
      hourlyIncrease,
      dailyFollowers,
      dailyIncrease
    }
  });
});

const makeQueryString = (obj) =>
  Object.entries(obj).map(([ k, v]) => `${k}=${v}`)
    .join('&');
  
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
    const db = await dbPromise;
    if (!await db.get('SELECT id from Users WHERE id = ?', id)) {
      await db.run(
        `INSERT INTO Users (id, username, url, imageUrl, accessToken)
          VALUES (?, ?, ?, ?, ?)
        `,
        id, username, url, imageUrl, access_token
      );
    }
    req.auth = {
      id, username, name, url, imageUrl
    };
    res.redirect('/dashboard');
  }
});

app.get('/login/medium', (req, res) => {
  const oauthBaseUrl = 'https://medium.com/m/oauth/authorize?';
  res.redirect('/');
  // client_id={{MEDIUM_CLIENT_ID}}&scope=basicProfile&state={{MEDIUM_SECRET}}&response_type=code&redirect_uri={{MEDIUM_REDIRECT_URI}}
});

app.get('/logout', (req, res) => {
  req.auth.destroy();
  res.redirect('/');
});

module.exports = app;
