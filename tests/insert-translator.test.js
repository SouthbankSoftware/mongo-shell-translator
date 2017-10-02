const assert = require('assert');
const insertTranslator = require('../src/insert-translator.js');
const commonTranslator = require('../src/common-translator');
const esprima = require('esprima');
const Context = require('../src/context');
const escodegen = require('escodegen');

describe('test insert translator', () => {
  it('test insert command translator with variable as paramter value', () => {
    let ast = esprima.parseScript('db.test.insert({a:var1})');
    let { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('insert', name);
    let { functionStatement, functionName, callStatement } = insertTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testInsertOne');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 2);
    assert.equal(functionStatement.params.length, 2);
    assert.equal(functionStatement.params[0].name, 'db');
    assert.equal(functionStatement.params[1].name, 'a');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = testInsertOne(db, var1);');
  });

  it('insert empty object', () => {
    let ast = esprima.parseScript('db.test.insert({})');
    let { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('insert', name);
    let { functionStatement, functionName, callStatement } = insertTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testInsertOne');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 2);
    assert.equal(functionStatement.params.length, 2);
    assert.equal(functionStatement.params[0].name, 'db');
    assert.equal(functionStatement.params[1].name, 'd');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = testInsertOne(db, {});');
  });
});
