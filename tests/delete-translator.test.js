const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');
const esprima = require('esprima');
const commonTranslator = require('../src/common-translator');
const Context = require('../src/context');
const assert = require('assert');
const escodegen = require('escodegen');

describe('test delete translator', () => {
  it('test deleteOne translator', () => {
    const ast = esprima.parseScript('db.test.deleteOne({"name": "joey"})');
    const { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('deleteOne', name);
    const { functionStatement, functionName, callStatement } = commonTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testDeleteOne');
    assert.equal(functionStatement.id.name, 'testDeleteOne');
  });

  it('test deleteMany translator', () => {
    const ast = esprima.parseScript('db.test.deleteMany({"name": "joey"})');
    const { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('deleteMany', name);
    const { functionStatement, functionName, callStatement } = commonTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testDeleteMany');
    assert.equal(functionStatement.id.name, 'testDeleteMany');
  });

  it('test delete with variable as parameter value', () => {
    const ast = esprima.parseScript('db.test.deleteMany([{"name": userName}])');
    const { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
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
});
