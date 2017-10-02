const assert = require('assert');
const findTranslator = require('../src/find-translator.js');
const commonTranslator = require('../src/common-translator');
const esprima = require('esprima');
const Context = require('../src/context');
const escodegen = require('escodegen');

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
    const { functionStatement, functionName, callStatement } = findTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context());
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testFind');
    assert.equal(functionStatement.id.name, 'testFind');
    assert.deepEqual(esprima.parseScript(escodegen.generate(functionStatement)), esprima.parseScript('function testFind(db) {\
    const useDb = db;\
    const query = {};\
      const returnData = new Promise(resolve => {\
        const arrayData = useDb.collection(\'test\').undefined(query);\
      resolve(arrayData);\
          });\
          return returnData;\
      }'));
  });
  it('find translator more than 4 parmaters', () => {
    const ast = esprima.parseScript('db.test.find({a:1, b:2, c:3, d:4, e:5}, {_id:0}, 100)');
    const { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('find', name);
    const { functionStatement, functionName, callStatement } = findTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context());
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testFind');
    assert.equal(functionStatement.id.name, 'testFind');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 3);
  });
  it('find translator extra parmaters', () => {
    const ast = esprima.parseScript('db.test.find({a:1, b:2, c:3, d:4, e:5}, {_id:0}, 100, 10, 1)');
    const { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('find', name);
    const { functionStatement, functionName, callStatement } = findTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context());
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testFind');
    assert.equal(functionStatement.id.name, 'testFind');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 5);
    assert.equal(escodegen.generate(functionStatement.body.body[2].body[0].declarations[0].init.arguments[0].body.body[0].body[0]), 'const arrayData = useDb.collection(\'test\').undefined(query).project({ _id: 0 }).limit(limit).skip(skip).batchSize(batchSize);');
  });
});
