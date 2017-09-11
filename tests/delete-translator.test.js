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

  it('test delete promise', () => {
    const translator = new MongoShellTranslator(options.syntaxType.promise);
    let nativeCode = translator.translate('db.test.deleteOne()');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').deleteOne({}).then(function (r) {});');

    nativeCode = translator.translate('db.explains.deleteOne({\'user.name.last\': \'Lee\'})');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'explains\').deleteOne({\'user.name.last\': \'Lee\'}).then(function (r) {});');

    nativeCode = translator.translate('db.explains.deleteOne({\'user.name.last\': \'Lee\'}, {w:1, wtimeout:400, j: false})');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'explains\').deleteOne({\'user.name.last\': \'Lee\'}, {w:1, wtimeout:400, j: false}).then(function (r) {});');
  });

  it('test delete await', () => {
    const translator = new MongoShellTranslator(options.syntaxType.await);

    let nativeCode = translator.translate('const fun = async function(){const r = db.explains.deleteOne({\'user.name.last\': \'Lee\'})}');
    utils.assertStatementEqual(nativeCode, 'const fun = async function(){const r = await db.collection(\'explains\').deleteOne({\'user.name.last\': \'Lee\'});};');

    nativeCode = translator.translate('const fun = async function(){const r = db.explains.deleteOne({\'user.name.last\': \'Lee\'}, {w:1, wtimeout:400, j: false})}');
    utils.assertStatementEqual(nativeCode, 'const fun = async function(){ const r = await db.collection(\'explains\').deleteOne({\'user.name.last\': \'Lee\'}, {w:1, wtimeout:400, j: false});};');
  });
});
