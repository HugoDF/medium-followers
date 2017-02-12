# Medium followers

Track and graph the number of Medium followers for a given handle.  

## Deploy

This is ready to deploy to heroku.

It tracks the follower count for the `username` set in `collectFollowers.js` (which is currently hugo__df).

It gets a new datapoint every 60000ms (every minute), you can change this

Change that to your username then create a new heroku app with a heroku Redis instance and push the code to it.

Scale the web process to 0 and the worker process to 1, from the command line:

```sh
$ heroku ps:scale web=0
$ heroku ps:scale worker=1
```

You will need to wait for some data to be collected before viewing it.

## View data

If you have the heroku command line tools installed you can run:
```sh
$ npm run graph
```
It will get the REDIS_URL from your config, get the data and graph it in the terminal using `blessed` and `blessed-contrib`.

If you do not have the heroku command line tools, you can run the `graph.js` directly after having set `REDIS_URL` to what the one on your heroku instance using something along the lines of:

```sh
$ env REDIS_URL=some_url node ./cli/graph.js
```