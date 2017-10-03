const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const commonTranslator = require('../src/common-translator');

describe('test common translator', () => {
  it('test find db name', () => {
    let ast = esprima.parseScript('db.test.find()');
    let dbName = commonTranslator.findDbName(ast.body[0]);
    assert.equal(dbName, 'db');

    ast = esprima.parseScript('mydb.test.find()');
    dbName = commonTranslator.findDbName(ast.body[0]);
    assert.equal(dbName, 'mydb');

    ast = esprima.parseScript('i = mydb.test.find()');
    dbName = commonTranslator.findDbName(ast.body[0]);
    assert.equal(dbName, 'mydb');

    ast = esprima.parseScript('var i = mydb.test.find()');
    dbName = commonTranslator.findDbName(ast.body[0]);
    assert.equal(dbName, 'mydb');
  });

  it('test get sibling db', () => {
    let ast = esprima.parseScript('db.getSiblingDB("test").find()');
    let dbName = commonTranslator.findDbName(ast.body[0]);
    assert.equal(dbName, 'db');

    ast = esprima.parseScript('i = db.getSiblingDB("test").find()');
    dbName = commonTranslator.findDbName(ast.body[0]);
    assert.equal(dbName, 'db');

    ast = esprima.parseScript('var i = db.getSiblingDB("test").find()');
    dbName = commonTranslator.findDbName(ast.body[0]);
    assert.equal(dbName, 'db');
  });

  it('test find collection name', () => {
    let ast = esprima.parseScript('db.test.find()');
    let name = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(name, 'test');

    ast = esprima.parseScript('db.SampleCollections.find({}, {})');
    name = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(name, 'SampleCollections');

    ast = esprima.parseScript('var i = db.SampleCollections.find({}, {})');
    name = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(name, 'SampleCollections');

    ast = esprima.parseScript('i = db.SampleCollections.find({}, {})');
    name = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(name, 'SampleCollections');

    ast = esprima.parseScript('i = db.getSiblingDB("SampleCollections").test.find({}, {})');
    name = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(name, 'test');

    ast = esprima.parseScript('i = db.getSiblingDB("SampleCollections").getCollection("test1").find({}, {})');
    name = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(name, 'test1');

    ast = esprima.parseScript('i = db.getSiblingDB("SampleCollections").getCollection().find({}, {})');
    name = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(name, undefined);
  });

  it('test find supported statement', () => {
    let ast = esprima.parseScript('db.test.find()');
    let supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 0);

    ast = esprima.parseScript('db.test.find({}, {}).sort({})');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 1);

    ast = esprima.parseScript('db.test.find({}, {}).sort({}).skip(10).limit(100)');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 3);
    assert.equal(supported.params[0].arguments[0].value, '100');
    assert.equal(supported.params[1].arguments[0].value, '10');

    ast = esprima.parseScript('var i = db.test.find({}, {})');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);

    ast = esprima.parseScript('var i = db.test.find({}, {}).sort({}).skip(10).limit(100)');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);

    ast = esprima.parseScript('i = db.test.find({}, {}).sort({}).skip(10).limit(100).sort()');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 4);
  });

  it('test update supported statement', () => {
    let ast = esprima.parseScript('db.test.update()');
    let supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'update');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 0);

    ast = esprima.parseScript('db.test.update({}, {}, {})');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'update');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.expression.arguments.length, 3);
  });


  it('test update on getSiblingDB statement', () => {
    let ast = esprima.parseScript('db.getSiblingDB("a").test.update()');
    let supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'update');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 0);
    assert.equal(supported.dbName, 'a');

    ast = esprima.parseScript('i = db.getSiblingDB("test").test.find({}, {}, {})');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.dbName, 'test');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.expression.arguments.length, 3);

    ast = esprima.parseScript('var i = db.getSiblingDB("test").test.insert({}, {}, {})');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'insert');
    assert.equal(supported.dbName, 'test');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.expression.arguments.length, 3);

    ast = esprima.parseScript('var i = db.getSiblingDB().test.insert({}, {}, {})');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'insert');
    assert.equal(supported.dbName, undefined);
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.expression.arguments.length, 3);

    ast = esprima.parseScript('var i = db.getSiblingDB("SampleCollections").getCollection("test").insert({}, {}, {})');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'insert');
    assert.equal(supported.dbName, 'SampleCollections');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.expression.arguments.length, 3);
    let colName = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(colName, 'test');
  });
});
