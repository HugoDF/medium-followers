const { expect } = require('chai');
const selectData = require('./selectData');

describe('selectData', () => {
  const fixtureData = [
    '{"value":354,"date":"2017-02-12T19:03:38.089Z"}',
    '{"value":354,"date":"2017-02-12T19:02:38.179Z"}'
  ];
  it('should throw an error if passed rawValues is not an Array', () => {
    let fn = selectData.bind(null, "notArray");
    expect(fn).to.throw(TypeError);
    fn = selectData.bind(null, 100);
    expect(fn).to.throw(TypeError);
  });
  it('should filter rawValues according to passed filterFn', () => {
    const filterNothing = () => true;
    let { x, y } = selectData(fixtureData, filterNothing);
    expect(x).to.have.length(fixtureData.length);
    expect(y).to.have.length(fixtureData.length);

    const filterAll = () => false;
    ({ x, y } = selectData([], filterNothing));
    expect(x).to.have.length(0);
    expect(y).to.have.length(0);
  });

  it('should return x and y arrays of the same size', () => {
    const { x, y } = selectData(fixtureData);
    expect(x).to.be.an('Array');
    expect(y).to.be.an('Array');
    expect(x).to.have.length(y.length)
  });

  it('should not return a number value for minY if y is not an array or has length 0', () => {
    const { minY } = selectData([]);
    expect(minY).to.equal(undefined);
  });

  it('should return the correct minY value if y is an array with more than 0 elements', () => {
    const selectAll = () => true;
    const { minY } = selectData([ ...fixtureData, '{"value":350,"date":"2017-02-10T19:02:38.179Z"}' ], selectAll);
    expect(minY).to.equal(350);
  });
});