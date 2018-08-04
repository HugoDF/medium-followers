const app = require('./app');

const followerCollector = require('./collect-followers');
// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

console.log('Starting follower collection');
followerCollector.run();
