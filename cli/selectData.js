const moment = require('moment');

function selectData(rawValues, filterFn = (_, i) => (i % 100 === 0)) {
  const display = rawValues
    .filter(filterFn)
    .reverse()
    .map(JSON.parse);

  const x = display.map(({ date }) => moment(date).format('DD/MM'));
  const y = display.map(({ value }) => value);

  const minY = y.reduce((prev, curr) => Math.min(prev, curr));

  return { x, y, minY };
}

module.exports = selectData;