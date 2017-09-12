const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;

describe('test error cases', () => {
  it('test parsing error syntax', () => {
    const translator = new MongoShellTranslator();
    let err;
    try {
      translator.translate('this is invalid statement');
    } catch (e) {
      err = e;
    }
    assert.notEqual(err, undefined);
  });
});
