const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const commonTranslator = require('../src/common-translator');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');

describe('test aggregate translator', () => {
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
  });
});
