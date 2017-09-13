const argumentCreator = require('../src/argument-creator');
const assert = require('assert');

describe('test argument creator', () => {
  it('test create argument', () => {
    let args = argumentCreator.createArguments({ arguments: [{}] }, 1, 1);
    assert.equal(1, args.length);
    args = argumentCreator.createArguments({ arguments: [] }, 1, 1);
    assert.equal(1, args.length);
    assert.equal(args[0].properties.length, 0);
  });

  it('test required argument', () => {
    // let args = argumentCreator.createArguments({ arguments: [{ a: 1 }] }, 0, 1);
    // assert.equal(1, args.length);
    // assert.equal(args[0].a, 1);
    const args = argumentCreator.createArguments({ arguments: [{ a: 1 }, { b: 2 }] }, 0, 1);
    assert.equal(args.length, 1);
    assert.equal(args[0].a, 1);
  });
});
