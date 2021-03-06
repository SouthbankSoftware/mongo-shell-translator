const assert = require('assert');
const esprima = require('esprima');
const CommonTranslator = require('../src/common-translator').CommonTranslator;
const findSupportedStatement = require('../src/utils').findSupportedStatement;
const escodegen = require('escodegen');

describe('test common translator', () => {
  const commonTranslator = new CommonTranslator();
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


  it('test update supported statement', () => {
    let ast = esprima.parseScript('db.test.update()');
    let supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'update');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 0);

    ast = esprima.parseScript('db.test.update({}, {}, {})');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'update');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.expression.arguments.length, 3);
  });


  it('test update on getSiblingDB statement', () => {
    let ast = esprima.parseScript('db.getSiblingDB("a").test.update()');
    let supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'update');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 0);
    assert.equal(supported.dbName, 'a');

    ast = esprima.parseScript('i = db.getSiblingDB("test").test.find({}, {}, {})');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.dbName, 'test');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.expression.arguments.length, 3);

    ast = esprima.parseScript('var i = db.getSiblingDB("test").test.insert({}, {}, {})');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'insert');
    assert.equal(supported.dbName, 'test');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.expression.arguments.length, 3);

    ast = esprima.parseScript('var i = db.getSiblingDB().test.insert({}, {}, {})');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'insert');
    assert.equal(supported.dbName, undefined);
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.expression.arguments.length, 3);

    ast = esprima.parseScript('var i = db.getSiblingDB("SampleCollections").getCollection("test").insert({}, {}, {})');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'insert');
    assert.equal(supported.dbName, 'SampleCollections');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.expression.arguments.length, 3);
    let colName = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(colName, 'test');
  });
});
