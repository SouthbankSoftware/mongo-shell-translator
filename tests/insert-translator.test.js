const assert = require('assert');
const InsertTranslator = require('../src/insert-translator.js').InsertTranslator;
const esprima = require('esprima');
const Context = require('../src/context');
const escodegen = require('escodegen');
const findSupportedStatement = require('../src/utils').findSupportedStatement;

describe('test insert translator', () => {
  const insertTranslator = new InsertTranslator();
  it('test insert command translator with variable as paramter value', () => {
    let ast = esprima.parseScript('db.test.insert({a:var1})');
    let { params, name, expression } = findSupportedStatement(ast.body[0]);
    assert.equal('insert', name);
    let { functionStatement, functionName, callStatement } = insertTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testInsertOne');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 2);
    assert.equal(functionStatement.params.length, 2);
    assert.equal(functionStatement.params[0].name, 'db');
    assert.equal(functionStatement.params[1].name, 'a');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = testInsertOne(db, var1);');

    ast = esprima.parseScript('db.test.insert(docs)');
    let supported = findSupportedStatement(ast.body[0]);
    assert.equal('insert', supported.name);
    let fun = insertTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.functionStatement.params.length, 2);
    assert.equal(fun.functionStatement.params[0].name, 'db');
    assert.equal(fun.functionStatement.params[1].name, 'docs');
    assert.equal(fun.functionName, 'testInsert');

    ast = esprima.parseScript('db.test.insertMany(docs)');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal('insertMany', supported.name);
    fun = insertTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.functionStatement.params.length, 2);
    assert.equal(fun.functionStatement.params[0].name, 'db');
    assert.equal(fun.functionStatement.params[1].name, 'docs');
    assert.equal(fun.functionName, 'testInsertMany');

    ast = esprima.parseScript('db.test.insertOne(docs)');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal('insertOne', supported.name);
    fun = insertTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.functionStatement.params.length, 2);
    assert.equal(fun.functionStatement.params[0].name, 'db');
    assert.equal(fun.functionStatement.params[1].name, 'docs');
    assert.equal(fun.functionName, 'testInsertOne');
  });

  it('insert empty object', () => {
    let ast = esprima.parseScript('db.test.insert({})');
    let { params, name, expression } = findSupportedStatement(ast.body[0]);
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

  it('test update with getSiblingDB and getCollection', () => {
    let ast = esprima.parseScript('db.getSiblingDB("test").getCollection("col1").insert({a:var1})');
    let { params, name, expression } = findSupportedStatement(ast.body[0]);
    assert.equal('insert', name);
    let { functionName, callStatement } = insertTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'col1InsertOne');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = col1InsertOne(db, var1);');

    ast = esprima.parseScript('db.getSiblingDB("test").col1.insert({b:true})');
    let supported = findSupportedStatement(ast.body[0]);
    let fun = insertTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.callStatement.body.length, 2);
    assert.equal(fun.functionName, 'col1InsertOne');
    assert.equal(escodegen.generate(fun.callStatement.body[0]), 'const results = col1InsertOne(db, true);');
  });
});
