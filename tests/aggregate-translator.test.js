const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const commonTranslator = require('../src/common-translator');
const AggregateTranslator = require('../src/aggregate-translator').AggregateTranslator;
const Context = require('../src/context');

describe('test aggregate translator', () => {
  const aggregateTranslator = new AggregateTranslator();
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

  it('test aggregate pipeline without match', () => {
    const aggregateTranslator = new AggregateTranslator();
    const command = 'db.enron_messages.aggregate([ \
    { $unwind: "$subFolder" }, {\
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
    assert.equal(escodegen.generate(functionStatement.body.body[1]), escodegen.generate(esprima.parseScript('const query = [{ $unwind: \'$subFolder\' }, { $limit: 20 }];')));
    assert.equal(escodegen.generate(functionStatement.body.body[2].body[0].declarations[0].init.arguments[0].body.body[0]),
      'const arrayData = useDb.collection(\'enron_messages\').aggregate(query, { allowDiskUse: true });');
  });

  it('test aggregate pipeline with limit', () => {
    const aggregateTranslator = new AggregateTranslator();
    const command = 'db.enron_messages.aggregate([ \
    { $limit:  20 },\
    {$sort:{  "tags":-1 }},\
]);\
';
    const ast = esprima.parseScript(command);
    const { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('aggregate', name);
    const { functionStatement, functionName, callStatement } = aggregateTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'enron_messagesAggregate');
    assert.equal(functionStatement.id.name, 'enron_messagesAggregate');
    assert.equal(escodegen.generate(functionStatement.body.body[1]), escodegen.generate(esprima.parseScript('const query = [{ $limit: 20 }, { $sort: { \'tags\': -1 } }];')));
    assert.equal(escodegen.generate(functionStatement.body.body[2].body[0].declarations[0].init.arguments[0].body.body[0]),
      'const arrayData = useDb.collection(\'enron_messages\').aggregate(query);');
  });
});
