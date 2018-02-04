module.exports = (obj) =>
  Object.entries(obj).map(([ k, v]) => `${k}=${v}`)
    .join('&');