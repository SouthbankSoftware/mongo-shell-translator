const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const commonTranslator = require('../src/common-translator');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');

describe('test find translator', () => {
  it('test translate find command with callback', () => {
    const translator = new MongoShellTranslator();
    let query = '';
    let driverCode = translator.translate('db.test.find()');
    assert.equal(driverCode, 'db.collection(\'test\').find().toArray(function (err, docs) {\n});');
    // test find with query parameters
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]},{_id:0})';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).toArray(function(err,docs){});');
    // test find with query and sort, limit
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray(function(err,docs){});');
    // test find with assignment
    query = 'rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'rets=db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray(function(err,docs){});');
    // test find with declative
    query = 'const rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'constrets=db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray(function(err,docs){});');
  });


  it('test translate find command with promise', () => {
    const translator = new MongoShellTranslator(options.syntaxType.promise);
    let query = '';
    let driverCode = translator.translate('db.test.find()');
    assert.equal(driverCode, 'db.collection(\'test\').find().toArray().then(function (docs) {\n});');
    // test find with query parameters
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]})';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).toArray().then(function(docs){});');
    // test find with query and sort, limit
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray().then(function(docs){});');
    // test find with assignment
    query = 'rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'rets=db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray().then(function(docs){});');
    // test find with declative
    query = 'const rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'constrets=db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray().then(function(docs){});');
  });

  it('test translate find command with await/sync', () => {
    const translator = new MongoShellTranslator(options.syntaxType.await);
    let query = '';
    let driverCode = translator.translate('db.test.find()');
    assert.equal(driverCode, 'await db.collection(\'test\').find().toArray();');
    // test find with query parameters
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]})';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'awaitdb.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).toArray();');
    // test find with query and sort, limit
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'awaitdb.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray();');
    // test find with assignment
    query = 'rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'rets=awaitdb.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray();');
    // test find with declative
    query = 'const rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    assert.equal(driverCode.replace(/\r?\n|\r|\s/g, ''), 'constrets=awaitdb.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray();');
  });

  it('test the find statement with toArray at the end', () => {
    let translator = new MongoShellTranslator(options.syntaxType.await);
    let driverCode = translator.translate('db.test.find().toArray()');
    assert.equal(driverCode, 'await db.collection(\'test\').find().toArray();');
    translator = new MongoShellTranslator(options.syntaxType.callback);
    driverCode = translator.translate('db.test.find().toArray()');
    assert.equal(driverCode, 'db.collection(\'test\').find().toArray(function (err, docs) {\n});');
    translator = new MongoShellTranslator(options.syntaxType.promise);
    driverCode = translator.translate('db.test.find().toArray()');
    assert.equal(driverCode, 'db.collection(\'test\').find().toArray().then(function (docs) {\n});');
  });
});
