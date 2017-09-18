const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const commonTranslator = require('../src/common-translator');

describe('test common translator', () => {
  it('test find db name', () => {
    let ast = esprima.parseScript('db.test.find()');
    let dbName = commonTranslator.findDbName(ast.body[0].expression);
    assert.equal(dbName, 'db');
    ast = esprima.parseScript('mydb.test.find()');
    dbName = commonTranslator.findDbName(ast.body[0].expression);
    assert.equal(dbName, 'mydb');
  });

  it('test get sibling db', () => {
    const ast = esprima.parseScript('db.getSiblingDB("test").find()');
    const dbName = commonTranslator.findDbName(ast.body[0].expression);
    assert.equal(dbName, 'db');
  });

  it('test find collection name', () => {
    let ast = esprima.parseScript('db.test.find()');
    let name = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(name, 'test');

    ast = esprima.parseScript('db.SampleCollections.find({}, {})');
    name = commonTranslator.findCollectionName(ast.body[0]);
    assert.equal(name, 'SampleCollections');
  });

  it('test find supported statement', () => {
    let ast = esprima.parseScript('db.test.find()');
    let supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported, 'find');

    ast = esprima.parseScript('db.test.find({}, {}).sort({})');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported, 'find');

    ast = esprima.parseScript('db.test.find({}, {}).sort({}).skip(10).limit(100)');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported, 'find');

    ast = esprima.parseScript('var i = db.test.find({}, {})');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported, 'find');

    ast = esprima.parseScript('var i = db.test.find({}, {}).sort({}).skip(10).limit(100)');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported, 'find');

    ast = esprima.parseScript('i = db.test.find({}, {}).sort({}).skip(10).limit(100)');
    supported = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal(supported, 'find');
  });
});
