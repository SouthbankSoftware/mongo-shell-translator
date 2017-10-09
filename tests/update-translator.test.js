const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const UpdateTranslator = require('../src/update-translator').UpdateTranslator;
const commonTranslator = require('../src/common-translator');
const options = require('../src/options');
const utils = require('./utils');
const Context = require('../src/context');

describe('test update translator', () => {
  const updateTranslator = new UpdateTranslator();
  it('test update translator', () => {
    let ast = esprima.parseScript('db.test.update({"name": "joey"}, {"name":"mike"})');
    const { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('update', name);
    const { functionStatement, functionName, callStatement } = updateTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testUpdateOne');
    assert.equal(functionStatement.id.name, 'testUpdateOne');

    ast = esprima.parseScript('db.test.udpate({"name": "joey"}, {"name":"mike"})');
  });

  it('update translator more than 4 parmaters', () => {
    let ast = esprima.parseScript('db.test.update({"name":"joey","name":"mike","name":"mike","name":"mike","name":"a"}, {a:1}, {multi:true})');
    let { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('update', name);
    let { functionStatement, functionName, callStatement } = updateTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testUpdateMany');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 4);

    ast = esprima.parseScript('db.test.update({"name":"joey","name":"mike","name":"mike","name":"mike","name":"a"}, {a:1})');
    const s = commonTranslator.findSupportedStatement(ast.body[0]);
    params = s.params;
    name = s.name;
    expression = s.expression;
    assert.equal('update', name);
    const fun = updateTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    functionStatement = fun.functionStatement;
    functionName = fun.functionName;
    callStatement = fun.callStatement;
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testUpdateOne');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 3);
  });

  it('test variable parameter value', () => {
    let ast = esprima.parseScript('db.test.update({a:var1}, {a:var2})');
    let { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('update', name);
    let { functionStatement, functionName, callStatement } = updateTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testUpdateOne');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 3);
    assert.equal(functionStatement.params.length, 3);
    assert.equal(functionStatement.params[0].name, 'db');
    assert.equal(functionStatement.params[1].name, 'a');
    assert.equal(functionStatement.params[2].name, 'aUpdated');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = testUpdateOne(db, var1, var2);');
  });

  it('test empty parameter value', () => {
    let ast = esprima.parseScript('db.test.update({}, {})');
    let { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('update', name);
    let { functionStatement, functionName, callStatement } = updateTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testUpdateOne');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 1);
    assert.equal(functionStatement.params.length, 1);
    assert.equal(functionStatement.params[0].name, 'db');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = testUpdateOne(db);');
  });

  it('test update with getSiblingDB and getCollection', () => {
    let ast = esprima.parseScript('db.getSiblingDB("test").getCollection("col1").update({a:var1}, {b:var2})');
    let { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('update', name);
    let { functionName, callStatement } = updateTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'col1UpdateOne');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = col1UpdateOne(db, var1, var2);');

    ast = esprima.parseScript('db.getSiblingDB("test").col1.update({a:var1}, {b:true}, {multi:true})');
    let supported = commonTranslator.findSupportedStatement(ast.body[0]);
    let fun = updateTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.callStatement.body.length, 2);
    assert.equal(fun.functionName, 'col1UpdateMany');
    assert.equal(escodegen.generate(fun.callStatement.body[0]), 'const results = col1UpdateMany(db, var1, true, { multi: true });');
  });
});
