const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');
const esprima = require('esprima');
const translator = require('../src/common-translator');
const CommonTranslator = require('../src/common-translator').CommonTranslator;
const Context = require('../src/context');
const assert = require('assert');
const escodegen = require('escodegen');

describe('test delete translator', () => {
  const commonTranslator = new CommonTranslator();
  it('test deleteOne translator', () => {
    const ast = esprima.parseScript('db.test.deleteOne({"name": "joey"})');
    const { params, name, expression } = translator.findSupportedStatement(ast.body[0]);
    assert.equal('deleteOne', name);
    const { functionStatement, functionName, callStatement } = commonTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testDeleteOne');
    assert.equal(functionStatement.id.name, 'testDeleteOne');
  });

  it('test deleteMany translator', () => {
    const ast = esprima.parseScript('db.test.deleteMany({"name": "joey"})');
    const { params, name, expression } = translator.findSupportedStatement(ast.body[0]);
    assert.equal('deleteMany', name);
    const { functionStatement, functionName, callStatement } = commonTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testDeleteMany');
    assert.equal(functionStatement.id.name, 'testDeleteMany');
  });

  it('test delete with variable as parameter value', () => {
    const ast = esprima.parseScript('db.test.deleteMany([{"name": userName}])');
    const { params, name, expression } = translator.findSupportedStatement(ast.body[0]);
    assert.equal('deleteMany', name);
    const { functionStatement, functionName, callStatement } = commonTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testDeleteMany');
    assert.equal(functionStatement.id.name, 'testDeleteMany');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 2);
    assert.equal(functionStatement.params.length, 2);
    assert.equal(functionStatement.params[0].name, 'db');
    assert.equal(functionStatement.params[1].name, 'name');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = testDeleteMany(db, userName);');
  });

  it('test delete with getSiblingDB and getCollection', () => {
    let ast = esprima.parseScript('db.getSiblingDB("test").getCollection("col1").deleteOne({a:var1})');
    let { params, name, expression } = translator.findSupportedStatement(ast.body[0]);
    assert.equal('deleteOne', name);
    let { functionName, callStatement } = commonTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'col1DeleteOne');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = col1DeleteOne(db, var1);');

    ast = esprima.parseScript('db.getSiblingDB("test").col1.deleteMany({b:true})');
    let supported = translator.findSupportedStatement(ast.body[0]);
    let fun = commonTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.callStatement.body.length, 2);
    assert.equal(fun.functionName, 'col1DeleteMany');
    assert.equal(escodegen.generate(fun.callStatement.body[0]), 'const results = col1DeleteMany(db, true);');
  });
});
