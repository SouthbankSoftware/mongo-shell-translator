const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');

describe('test update translator', () => {
  it('test update callback', () => {
    const translator = new MongoShellTranslator();
    let nativeCode = translator.translate('db.test.update()');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').updateOne({},{},{},function (err, r) {});');
    nativeCode = translator.translate('db.test.update({a:1}, {b:2, a:1}, {upsert:true, w: 1})');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').updateOne({a:1}, {b:2, a:1}, {upsert:true, w: 1},function (err, r) {});');
  });
});
