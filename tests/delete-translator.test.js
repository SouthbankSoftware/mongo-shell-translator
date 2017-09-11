const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');

describe('test delete translator', () => {
  it('test delete callback', () => {
    const translator = new MongoShellTranslator();
    let nativeCode = translator.translate('db.test.deleteOne()');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').deleteOne({},function (err, r) {});');

    nativeCode = translator.translate('db.explains.deleteOne({\'user.name.last\': \'Lee\'})');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'explains\').deleteOne({\'user.name.last\': \'Lee\'},function (err, r) {});');

    nativeCode = translator.translate('db.explains.deleteOne({\'user.name.last\': \'Lee\'}, {w:1, wtimeout:400, j: false})');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'explains\').deleteOne({\'user.name.last\': \'Lee\'}, {w:1, wtimeout:400, j: false},function (err, r) {});');
  });
});
