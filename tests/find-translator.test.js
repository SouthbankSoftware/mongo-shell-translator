const assert = require('assert');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');
const findTranslator = require('../src/find-translator.js');
const commonTranslator = require('../src/common-translator');
const esprima = require('esprima');

describe('test find translator', () => {
  it('test get json expression of find command', () => {
    let ast = esprima.parseScript('db.test.find()');
    let { params } = commonTranslator.findSupportedStatement(ast.body[0]);
    let exp = findTranslator.getJsonExpression(params);
    assert.equal(exp.length, 0);

    ast = esprima.parseScript('db.test.find().skip(100)');
    params = commonTranslator.findSupportedStatement(ast.body[0]).params;
    exp = findTranslator.getJsonExpression(params);
    assert.equal(exp.length, 1);
    assert.equal(exp[0].name, 'skip');
    assert.equal(exp[0].parameters, 100);

    ast = esprima.parseScript('db.test.find().skip(100).limit(1000).sort({a:true})');
    params = commonTranslator.findSupportedStatement(ast.body[0]).params;
    exp = findTranslator.getJsonExpression(params);
    assert.equal(exp.length, 3);
    assert.equal(exp[2].name, 'skip');
    assert.equal(exp[2].parameters, 100);
    assert.equal(exp[1].name, 'limit');
    assert.equal(exp[1].parameters, 1000);
    assert.equal(exp[0].name, 'sort');
    assert.equal(exp[0].parameters, '{ a: true }');
  });

  it('find translator empty statement ', () => {
    const ast = esprima.parseScript('db.test.find()');
    const { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('find', name);
    const { functionStatement, functionName, callStatement } = findTranslator.createParameterizedFunction(ast.body[0], expression, params);
    assert.equal(callStatement.body.length, 1);
    assert.equal(functionName, 'testFind');
    assert.equal(functionStatement.id.name, 'testFind');
  });
});
