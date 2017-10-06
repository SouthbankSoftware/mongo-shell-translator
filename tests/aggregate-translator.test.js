const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const commonTranslator = require('../src/common-translator');
const aggregateTranslator = require('../src/aggregate-translator');
const Context = require('../src/context');

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
    const ast = esprima.parseScript(command);
    const { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('aggregate', name);
    const { functionStatement, functionName, callStatement } = aggregateTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'enron_messagesAggregate');
    assert.equal(functionStatement.id.name, 'enron_messagesAggregate');
  });
});
