const readValues = require('../db/readValues');
const selectData = require('./selectData');
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const screen = blessed.screen();

function renderDashboard({ x, y, minY }) {
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
      showNthLabel: 5,
      label: 'Followers by date',
      minY
    });

    screen.append(line);
    screen.key(['escape', 'q', 'C-c'], function (ch, key) {
      return process.exit(0);
    });

    line.setData([{ x, y }]);

    screen.render();
  };
}

readValues(function (values) {

  const { x, y, minY } = selectData(values);

  const renderDashboardWithData = renderDashboard({ x, y, minY });

  renderDashboardWithData();

  screen.on('resize', renderDashboardWithData);

});