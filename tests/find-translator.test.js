const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const findtranslator = require('../src/find-translator');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;

describe('test find translator', () => {
  it('test find db name', () => {
    let ast = esprima.parseScript('db.test.find()');
    let dbName = findtranslator.findDbName(ast.body[0].expression);
    assert.equal(dbName, 'db');
    ast = esprima.parseScript('mydb.test.find()');
    dbName = findtranslator.findDbName(ast.body[0].expression);
    assert.equal(dbName, 'mydb');
  });

  it('test translate find command with callback', () => {
    const translator = new MongoShellTranslator();
    let query = '';
    let driverCode = translator.translate('db.test.find()');
    assert.equal(driverCode, 'db.collection(\'test\').find().toArray(function (err, docs) {\n});');
    // test find with query parameters
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]})';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).toArray(function(err,docs){});');
    // test find with query and sort, limit
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray(function(err,docs){});');
    // test find with assignment
  });
});
