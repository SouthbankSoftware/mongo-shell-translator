const assert = require('assert');
const FindTranslator = require('../src/find-translator.js').FindTranslator;
const esprima = require('esprima');
const Context = require('../src/context');
const escodegen = require('escodegen');
const FindOneTranslator = require('../src/find-one-translator').FindOneTranslator;
const findSupportedStatement = require('../src/utils').findSupportedStatement;

describe('test find translator', () => {
  it('test get json expression of find command', () => {
    const findTranslator = new FindTranslator();
    let ast = esprima.parseScript('db.test.find()');
    let { params } = findSupportedStatement(ast.body[0]);
    let exp = findTranslator.getJsonExpression(params);
    assert.equal(exp.length, 0);

    ast = esprima.parseScript('db.test.find().skip(100)');
    params = findSupportedStatement(ast.body[0]).params;
    exp = findTranslator.getJsonExpression(params);
    assert.equal(exp.length, 1);
    assert.equal(exp[0].name, 'skip');
    assert.equal(exp[0].parameters, 100);

    ast = esprima.parseScript('db.test.find().skip(100).limit(1000).sort({a:true})');
    params = findSupportedStatement(ast.body[0]).params;
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
    const findTranslator = new FindTranslator();
    const ast = esprima.parseScript('db.test.find()');
    const { params, name, expression } = findSupportedStatement(ast.body[0]);
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
    const findTranslator = new FindTranslator();
    const ast = esprima.parseScript('db.test.find({a:1, b:2, c:3, d:4, e:5}, {_id:0}, 100)');
    const { params, name, expression } = findSupportedStatement(ast.body[0]);
    assert.equal('find', name);
    const { functionStatement, functionName, callStatement } = findTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context());
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testFind');
    assert.equal(functionStatement.id.name, 'testFind');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 4);
  });

  it('find translator extra parmaters', () => {
    const findTranslator = new FindTranslator();
    let ast = esprima.parseScript('db.test.find({a:1, b:2, c:3, d:4, e:5}, {_id:0}, 100, 10, 1)');
    let { params, name, expression } = findSupportedStatement(ast.body[0]);
    assert.equal('find', name);
    let { functionStatement, functionName, callStatement } = findTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context(), name);
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testFind');
    assert.equal(functionStatement.id.name, 'testFind');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 6);
    assert.equal(escodegen.generate(functionStatement.body.body[2].body[0].declarations[0].init.arguments[0].body.body[0].body[0]), 'const arrayData = useDb.collection(\'test\').find(query).project(fields).limit(limit).skip(skip).batchSize(batchSize).toArray();');
    assert.equal(escodegen.generate(callStatement.body[0]), escodegen.generate(esprima.parseScript('const results = testFind(db, {\'a\': 1,    \'b\': 2,    \'c\': 3,    \'d\': 4,    \'e\': 5}, { _id: 0 }, 100, 10, 1);')));

    ast = esprima.parseScript('db.test.find({}, {})');
    let statement = findSupportedStatement(ast.body[0]);
    params = statement.params;
    expression = statement.expression;
    let funStatement = findTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context());
    functionStatement = funStatement.functionStatement;
    callStatement = funStatement.callStatement;
    functionName = funStatement.functionName;
    assert.equal(functionStatement.params[0].name, 'db');
    assert.equal(functionStatement.params[1].name, 'q');
    assert.equal(functionStatement.params[2].name, 'fields');
    assert.equal(functionStatement.params.length, 3);
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = testFind(db, {}, {});');
  });

  it('find parameter use variable', () => {
    const findTranslator = new FindTranslator();
    let ast = esprima.parseScript('db.test.find({a:var1})');
    let { params, name, expression } = findSupportedStatement(ast.body[0]);
    assert.equal('find', name);
    let { functionStatement, functionName, callStatement } = findTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context());
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'testFind');
    assert.equal(callStatement.body[0].declarations[0].init.arguments.length, 2);
    assert.equal(functionStatement.params.length, 2);
    assert.equal(functionStatement.params[0].name, 'db');
    assert.equal(functionStatement.params[1].name, 'a');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = testFind(db, var1);');
  });

  it('test find with getSiblingDB and getCollection', () => {
    const findTranslator = new FindTranslator();
    let ast = esprima.parseScript('db.getSiblingDB("test").getCollection("col1").find({a:var1})');
    let { params, name, expression } = findSupportedStatement(ast.body[0]);
    assert.equal('find', name);
    let { functionName, callStatement } = findTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context());
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'col1Find');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = col1Find(db, var1);');

    ast = esprima.parseScript('db.getSiblingDB("test").col1.find({a:var1})');
    let supported = findSupportedStatement(ast.body[0]);
    let fun = findTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context());
    assert.equal(fun.callStatement.body.length, 2);
    assert.equal(fun.functionName, 'col1Find');
    assert.equal(escodegen.generate(fun.callStatement.body[0]), 'const results = col1Find(db, var1);');
  });

  it('test findOne with getSiblingDB and getCollection', () => {
    const findOneTranslator = new FindOneTranslator();
    let ast = esprima.parseScript('db.getSiblingDB("test").getCollection("col1").findOne({a:var1})');
    let { params, name, expression } = findSupportedStatement(ast.body[0]);
    assert.equal('findOne', name);
    let { functionName, callStatement } = findOneTranslator.createParameterizedFunction(ast.body[0], expression, params, new Context());
    assert.equal(callStatement.body.length, 2);
    assert.equal(functionName, 'col1FindOne');
    assert.equal(escodegen.generate(callStatement.body[0]), 'const results = col1FindOne(db, var1);');

    ast = esprima.parseScript('db.getSiblingDB("test").col1.findOne({a:var1})');
    let supported = findSupportedStatement(ast.body[0]);
    let fun = findOneTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context());
    assert.equal(fun.callStatement.body.length, 2);
    assert.equal(fun.functionName, 'col1FindOne');
    assert.equal(escodegen.generate(fun.callStatement.body[0]), 'const results = col1FindOne(db, var1);');
  });

  it('test parse sort for find', () => {
    const findTranslator = new FindTranslator();
    let ast = esprima.parseScript('db.getSiblingDB("test").getCollection("col1").find({a:var1}).sort()');
    let supported = findSupportedStatement(ast.body[0]);
    assert.equal('find', supported.name);
    let fun = findTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.functionStatement.params.length, 3);
    assert.equal(fun.functionStatement.params[2].name, 'sort');
    assert.equal(escodegen.generate(fun.callStatement.body[0]), 'const results = col1Find(db, var1, {});');

    ast = esprima.parseScript('db.getSiblingDB("test").getCollection("col1").find({a:var1}).sort({a:1})');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal('find', supported.name);
    fun = findTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.functionStatement.params.length, 3);
    assert.equal(fun.functionStatement.params[2].name, 'sort');
    assert.equal(escodegen.generate(fun.callStatement.body[0]), 'const results = col1Find(db, var1, { a: 1 });');
  });

  it('test parse count for find', () => {
    const findTranslator = new FindTranslator();
    let ast = esprima.parseScript('db.getSiblingDB("test").getCollection("col1").find({a:var1}).count()');
    let supported = findSupportedStatement(ast.body[0]);
    assert.equal('find', supported.name);
    let fun = findTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.functionStatement.params.length, 3);
    assert.equal(fun.functionStatement.params[2].name, 'count');
    assert.equal(escodegen.generate(fun.callStatement.body[0]), 'const results = col1Find(db, var1, {});');
    // assert.equal(fun.functionStatement.body.body[2].body[0].declarations, '');
    assert.equal(escodegen.generate(fun.functionStatement.body.body[2].body[0].declarations[0].init.arguments[0].body.body[0]), 'const arrayData = useDb.collection(\'col1\').find(query).limit(20).count(count).toArray();');
  });

  it('test find one field with mutiple operator', () => {
    const findTranslator = new FindTranslator();
    let ast = esprima.parseScript('db.test.find({ age: { $exists: true, $lt:0 } })');
    let supported = findSupportedStatement(ast.body[0]);
    assert.equal('find', supported.name);
    let fun = findTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.functionStatement.params.length, 3);
    assert.equal(fun.functionStatement.params[1].name, 'existsAge');
    assert.equal(fun.functionStatement.params[2].name, 'ltAge');
  });

  it('test find with toArray', () => {
    const findTranslator = new FindTranslator();
    let ast = esprima.parseScript('db.test.find({ age: { $exists: true, $lt:0 } }).toArray()');
    let supported = findSupportedStatement(ast.body[0]);
    assert.equal('find', supported.name);
    let fun = findTranslator.createParameterizedFunction(ast.body[0], supported.expression, supported.params, new Context(), supported.name);
    assert.equal(fun.functionStatement.params.length, 3);
    assert.equal(fun.functionStatement.params[1].name, 'existsAge');
    assert.equal(fun.functionStatement.params[2].name, 'ltAge');
  });
});
