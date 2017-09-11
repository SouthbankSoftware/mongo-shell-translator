const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const commonTranslator = require('../src/common-translator');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');

describe('test aggregate translator callback function', () => {
  it('test aggregate pipeline', () => {
    const translator = new MongoShellTranslator();
    let nativeCode = translator.translate('db.test.aggregate()');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').aggregate().toArray(function (err, docs) {});');
    nativeCode = translator.translate('db.test.aggregate([], {explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true})');
    utils.assertStatementEqual(nativeCode, 'db.collection(\'test\').aggregate([], {explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true}).toArray(function (err, docs) {});');
  });
});
