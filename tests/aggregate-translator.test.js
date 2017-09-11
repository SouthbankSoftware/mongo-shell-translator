const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const commonTranslator = require('../src/common-translator');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');

describe('test aggregate translator', () => {
  it('test aggregate pipeline callback', () => {
    const translator = new MongoShellTranslator();
    let nativeCode = translator.translate('db.test.aggregate()');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').aggregate().toArray(function (err, docs) {});');
    nativeCode = translator.translate('db.test.aggregate([], {explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true})');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').aggregate([], {explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true}).toArray(function (err, docs) {});');
    nativeCode = translator.translate('db.test.aggregate().toArray()');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').aggregate().toArray(function (err, docs) {});');
  });

  it('test aggregate pipeline promise', () => {
    const translator = new MongoShellTranslator(options.syntaxType.promise);
    let nativeCode = translator.translate('db.test.aggregate()');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').aggregate().toArray().then(function (docs) {});');
    nativeCode = translator.translate('db.test.aggregate([], {explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true})');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').aggregate([], {explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true}).toArray().then(function (docs) {});');

    nativeCode = translator.translate('db.test.aggregate([], {explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true}).toArray();');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').aggregate([], {explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true}).toArray().then(function (docs) {});');
  });

  it('test aggregate pipeline await', () => {
    const translator = new MongoShellTranslator(options.syntaxType.await);
    let nativeCode = translator.translate('const fun = async function(){db.test.aggregate()}');
    utils.assertStatementEqual(nativeCode, 'const fun = async function(){await db.collection(\'test\').aggregate().toArray();};');
    nativeCode = translator.translate('const fun = async function(){db.test.aggregate([], {explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true})}');
    utils.assertStatementEqual(nativeCode, 'const fun = async function(){await db.collection(\'test\').aggregate([], {explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true}).toArray();};');
  });

  it('test complicated aggregate command', () => {
    const command = 'db.enron_messages.aggregate([ {\
      $match: {\
        "$and": [\
          { "headers.To": { $ne: "" } }\
        ]\
      }\
    },\
    { $unwind: "$subFolder" }, {\
      $group: {\
        _id: { "filename": "$filename" },\
        "count": { $sum: 1 },\
        "headers-sum": { $sum: "$headers" }\
      }\
    },\
], { allowDiskUse: true });\
';
    const driverCode = 'db.collection(\'enron_messages\').aggregate([\
    { $match: { \'$and\': [{ \'headers.To\': { $ne: \'\' } }] } },\
    { $unwind: \'$subFolder\' },\
    {\
        $group: {\
            _id: { \'filename\': \'$filename\' },\
            \'count\': { $sum: 1 },\
            \'headers-sum\': { $sum: \'$headers\' }\
        }\
    }\
], { allowDiskUse: true }).toArray().then(function (docs) {\
});';
    const translator = new MongoShellTranslator(options.syntaxType.promise);
    const nativeCode = translator.translate(command);
    utils.assertStatementEqual(nativeCode, driverCode);
  });
});
