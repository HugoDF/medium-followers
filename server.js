const app = require('./app');
const followerCollector = require('./collect-followers');
// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  if (process.env.NODE_ENV === 'development') {
    const port = parseInt(process.env.PORT, 10);
    const browserSync = require('browser-sync');
    browserSync({
      files: ['views/**/*.{handlebars}', './static/*.css'],
      online: false,
      open: false,
      port: port + 1,
      proxy: 'localhost:' + port,
      ui: false
    });
  }
});

console.log('Starting follower collection');
if (process.env.NODE_ENV !== 'development') {
  followerCollector.run();
}
