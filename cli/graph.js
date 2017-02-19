const readValues = require('../db/readValues');
const selectData = require('./selectData');
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const screen = blessed.screen();

function renderDashboard({ x, y, minY, maxY }) {
  return () => {
    const line = contrib.line({
      style:
      {
        line: 'yellow',
        text: 'green',
        baseline: 'cyan'
      },
      xLabelPadding: 3,
      xPadding: 5,
      numYLabels: 25,
      showNthLabel: 5,
      label: 'Followers by date',
      maxY: maxY + 10,
      minY: minY - 10
    });

    screen.append(line);
    screen.key(['escape', 'q', 'C-c'], function (ch, key) {
      return process.exit(0);
    });

    line.setData([{ x, y }]);

    screen.render();
  };
}

function graphValues(values) {
  const data = selectData(values);
  const renderDashboardWithData = renderDashboard(data);

  renderDashboardWithData();

  screen.on('resize', renderDashboardWithData);
}

function run(REDIS_URL) {
  readValues(
    graphValues,
    { REDIS_URL }
  );
}

if(require.main === module) {
  run(process.env.REDIS_URL);
}

module.exports = run;