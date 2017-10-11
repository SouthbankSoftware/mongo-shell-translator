const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;

describe('test delete translator', () => {
  it('test delete collection', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('print("Hello")');
    const expected = 'console.log("Hello")';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });
});
