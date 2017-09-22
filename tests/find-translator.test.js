const assert = require('assert');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');
const createParameterizedFunction = require('../src/find-translator.js').createParameterizedFunction;

describe('test find translator', () => {
  it('test translate find command with callback', () => {
    const translator = new MongoShellTranslator();
    const query = '';
    const driverCode = translator.translate('db.test.find()');
    utils.assertStatementEqual(driverCode, 'db.collection(\'test\').find().toArray(function (err, docs) {\n});');
  });
});
