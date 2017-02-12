const moment = require('moment');

function selectData(rawValues, filterFn = (_, i) => (i % 100 === 0)) {
  if(!Array.isArray(rawValues)) {
    throw new TypeError('values should be an Array');
  }
  const display = rawValues
    .filter(filterFn)
    .reverse()
    .map(JSON.parse);

  const x = display.map(({ date }) => moment(date).format('DD/MM'));
  const y = display.map(({ value }) => value);

  const minY = y.length > 0 ?
    y.reduce((prev, curr) => Math.min(prev, curr))
    :
    undefined;

  return { x, y, minY };
}

module.exports = selectData;