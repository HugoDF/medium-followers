const express = require('express');
const exphbs  = require('express-handlebars');


const axios = require('axios');
const app = express();

const sessions = require('client-sessions');

const { dbPromise } = require('./db/connect');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// app.use('/static', express.static('.data'));

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

const addHours = require('date-fns/add_hours');
const addDays = require('date-fns/add_days');
const addMonths = require('date-fns/add_months');
const getYear = require('date-fns/get_year');
const format = require('date-fns/format');

const { user, getCurrentFollowerCountForUserId } = require('./models');

async function getFollowerChartDataForTimePeriod({ db, id }) {
  const now = Date.now();
  const rawData = await db.all(
    'SELECT number, createdAt FROM FollowerCount WHERE userId = ? AND createdAt > ? ORDER BY createdAt ASC',
    id, addMonths(now, -1).getTime()
  );
  const data = rawData.filter(el => el.number !== null);

  const timeSlices = Array.from({ length: 30 }, (_, i) => {
    const dateTime = addDays(now, -i - .5);
    const formattedDate = format(dateTime, 'DD/MM');
    const { number: followerCount } = data.find(el => el.createdAt > dateTime) || {};
    return {
      rawDate: dateTime,
      formattedDate,
      followerCount
    };
  }).filter(({ followerCount }) => Boolean(followerCount))
  .sort((a, b) => a.rawDate > b.rawDate ? 1 : -1);

  const maxFollowerCount = timeSlices.reduce((max, { followerCount }) => max > followerCount ? max : followerCount, 0);
  const minFollowerCount = timeSlices.reduce((min, { followerCount }) => min < followerCount ? min : followerCount, Infinity);
  console.log(maxFollowerCount, minFollowerCount);
  return {
    timeSlices,
    maxFollowerCount,
    minFollowerCount
  };
}

app.get('/dashboard', async (req, res) => {
  if(!req.auth || !req.auth.id) {
    res.redirect('/');
  }
  const currentFollowers = await(getCurrentFollowerCountForUserId);
  res.render('dashboard', {
    currentFollowers

    // ...baseData(req),
    // data: {
    //   currentFollowers,
    //   hourlyFollowers,
    //   hourlyIncrease,
    //   dailyFollowers,
    //   dailyIncrease,
    //   weeklyFollowers,
    //   weeklyIncrease,
    //   monthlyFollowers,
    //   monthlyIncrease,
    //   followersFromYearStart,
    //   increaseFromStartOfYear
    // },
    // initialData: JSON.stringify({
    //   data: data.map((el) => ({
    //     ...el,
    //     createdAt: format(el.createdAt)
    //   })),
    //   startDate: addDays(now, -7),
    //   ...(await getFollowerChartDataForTimePeriod({ db, id: req.auth.id }))
    // })
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
    const activeUser = await getUserById(id);
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
