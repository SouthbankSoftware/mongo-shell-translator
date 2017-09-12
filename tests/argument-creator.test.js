const argumentCreator = require('../src/argument-creator');
const assert = require('assert');

describe('test argument creator', () => {
  it('test create argument', () => {
    let args = argumentCreator.createArguments({ arguments: [{}] }, 1, true);
    assert.equal(1, args.length);
    args = argumentCreator.createArguments({ arguments: [] }, 1, true);
    assert.equal(1, args.length);
    assert.equal(args[0].properties.length, 0);
  });
});
