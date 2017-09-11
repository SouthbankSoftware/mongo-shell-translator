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
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').updateOne({},{},function (err, r) {});');

    nativeCode = translator.translate('db.test.update({a:1}, {b:2, a:1}, {upsert:true, w: 1})');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').updateOne({a:1}, {b:2, a:1}, {upsert:true, w: 1},function (err, r) {});');

    nativeCode = translator.translate('db.collection.updateOne(\
    { "name" : "Central Perk Cafe" },\
    { $set: { "violations" : 3 } })');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'collection\').updateOne({ "name" : "Central Perk Cafe" }, { $set: { "violations" : 3 } },function (err, r) {});');

    nativeCode = translator.translate('db.collection.updateOne(\
    { "name" : "Central Perk Cafe" })');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'collection\').updateOne({ "name" : "Central Perk Cafe" }, {},function (err, r) {});');
  });

  it('test update promise', () => {
    const translator = new MongoShellTranslator(options.syntaxType.promise);
    let nativeCode = translator.translate('db.test.update()');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').updateOne({},{}).then(function (r) {});');

    nativeCode = translator.translate('db.test.update({a:1}, {b:2, a:1}, {upsert:true, w: 1, multi: true})');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').updateMany({a:1}, {b:2, a:1}, {upsert:true, w: 1}).then(function (r) {});');

    nativeCode = translator.translate('db.collection.updateOne(\
    { "name" : "Central Perk Cafe" },\
    { $set: { "violations" : 3 } })');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'collection\').updateOne({ "name" : "Central Perk Cafe" }, { $set: { "violations" : 3 } }).then(function (r) {});');

    nativeCode = translator.translate('db.collection.updateOne(\
    { "name" : "Central Perk Cafe" })');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'collection\').updateOne({ "name" : "Central Perk Cafe" }, {}).then(function (r) {});');
  });

  it('test update await', () => {
    const translator = new MongoShellTranslator(options.syntaxType.await);
    const nativeCode = translator.translate('const fun = async function(){const r = db.test.update()}');
    utils.assertStatementEqual(nativeCode, 'const fun = async function(){const r = await db.collection(\'test\').updateOne({},{});};');
  });
});
