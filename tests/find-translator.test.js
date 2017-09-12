const assert = require('assert');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const options = require('../src/options');
const utils = require('./utils');

describe('test find translator', () => {
  it('test translate find command with callback', () => {
    const translator = new MongoShellTranslator();
    let query = '';
    let driverCode = translator.translate('db.test.find()');
    utils.assertStatementEqual(driverCode, 'db.collection(\'test\').find({}).toArray(function (err, docs) {\n});');
    // test find with query parameters
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]},{_id:0})';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).toArray(function(err,docs){});');
    // test find with query and sort, limit
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray(function(err,docs){});');
    // test find with assignment
    query = 'rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'rets=db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray(function(err,docs){});');
    // test find with declative
    query = 'const rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'const rets=db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray(function(err,docs){});');
  });


  it('test translate find command with promise', () => {
    const translator = new MongoShellTranslator(options.syntaxType.promise);
    let query = '';
    let driverCode = translator.translate('db.test.find()');
    utils.assertStatementEqual(driverCode, 'db.collection(\'test\').find({}).toArray().then(function (docs) {\n});');
    // test find with query parameters
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]})';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).toArray().then(function(docs){});');
    // test find with query and sort, limit
    query = 'db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray().then(function(docs){});');
    // test find with assignment
    query = 'rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'rets=db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray().then(function(docs){});');
    // test find with declative
    query = 'const rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'const rets=db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray().then(function(docs){});');
  });

  it('test translate find command with await/sync', () => {
    const translator = new MongoShellTranslator(options.syntaxType.await);
    let query = '';
    let driverCode = translator.translate('const fun = async function(){db.test.find()}');
    utils.assertStatementEqual(driverCode, 'const fun = async function(){await db.collection(\'test\').find({}).toArray();};');
    // test find with query parameters
    query = 'const fun = async function(){db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]})}';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'const fun = async function(){await db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).toArray();};');
    // test find with query and sort, limit
    query = 'const fun = async function(){db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)}';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'const fun = async function(){await db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray();};');
    // test find with assignment
    query = 'const fun = async function(){rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)}';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'const fun = async function(){rets=await db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray();};');
    // test find with declative
    query = 'const fun = async function(){const rets=db.test.find({$and:[{"lname":"Ford"},{"marks.english": {$gt:35}}]}).sort({"name":1}).limit(100)}';
    driverCode = translator.translate(query);
    utils.assertStatementEqual(driverCode, 'const fun = async function(){const rets=await db.collection(\'test\').find({$and:[{\'lname\':\'Ford\'},{\'marks.english\':{$gt:35}}]}).sort({\'name\':1}).limit(100).toArray();};');
  });

  it('test the find statement with toArray at the end', () => {
    let translator = new MongoShellTranslator(options.syntaxType.await);
    let driverCode = translator.translate('const fun = async function(){db.test.find().toArray()}');
    utils.assertStatementEqual(driverCode, 'const fun = async function(){await db.collection(\'test\').find({}).toArray();};');
    translator = new MongoShellTranslator(options.syntaxType.callback);
    driverCode = translator.translate('db.test.find().toArray()');
    utils.assertStatementEqual(driverCode, 'db.collection(\'test\').find({}).toArray(function (err, docs) {\n});');
    translator = new MongoShellTranslator(options.syntaxType.promise);
    driverCode = translator.translate('db.test.find().toArray()');
    utils.assertStatementEqual(driverCode, 'db.collection(\'test\').find({}).toArray().then(function (docs) {\n});');
  });

  it('test db.getSiblingDB parser', () => {
    const translator = new MongoShellTranslator();
    const driverCode = translator.translate('db.getSiblingDB("db").aaaa.find({"name":"joey"}, {_id: 0}) ');
    utils.assertStatementEqual(driverCode, 'db.collection(\'aaaa\').find({ \'name\': \'joey\' }).toArray(function (err, docs) {});');
  });
});
