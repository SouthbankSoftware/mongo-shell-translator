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
});
