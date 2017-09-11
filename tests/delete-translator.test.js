const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');

describe('test delete translator', () => {
  it('test delete callback', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('db.test.deleteOne()');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').deleteOne({},function (err, r) {});');
  });
});
