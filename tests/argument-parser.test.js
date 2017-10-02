const assert = require('assert');
const parameterParser = require('../src/parameter-parser');
const esprima = require('esprima');
const translator = require('../src/common-translator');

describe('argument parser test suite', () => {
  it('test get argument number', () => {
    let code = esprima.parseScript('db.test.find()');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 0);

    code = esprima.parseScript('db.test.find({})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 0);

    code = esprima.parseScript('db.test.find({"name": "Joey"})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 1);

    code = esprima.parseScript('db.test.find({"name": "Joey", "full-name": {"last": "zhao", "first": "yi"}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 3);

    code = esprima.parseScript('db.test.find({"age": 100, "nested1": {"key1": 1, "nested2": {"key2": 2, "nested3": {"key3": "key3"}}}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 4);

    code = esprima.parseScript('db.test.find({"age": 100, "nested1": {"key1": 1, "nested2": {"key2": 2, "nested3": {"key3": "key3"}}}, "key4": "v4", "key5":"v5"})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 6);

    code = esprima.parseScript('db.test.find({})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 0);

    code = esprima.parseScript('db.test.find({$and: [{"first": "f"}, {"last": "l"}, {"middle": "m"}]})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 3);

    code = esprima.parseScript('db.test.find({ qty: { $in: [ 5, 15 ] } })');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 1);
  });

  it('test parser empty query parameter', () => {
    let code = esprima.parseScript('db.test.find()');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    let qCode = parseRet.queryObject;
    const parameters = parseRet.parameters;
    assert.equal(qCode, '');
    assert.equal(parameters.length, 0);

    code = esprima.parseScript('db.test.find({})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    assert.equal(qCode, '{}');

    code = esprima.parseScript('db.test.find()');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    assert.equal(qCode, '');

    code = esprima.parseScript('db.test.find({})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    assert.equal(qCode, '{}');
  });

  it('test parse simple query parameters', () => {
    let code = esprima.parseScript('db.test.find({"name": "Joey"})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    let qCode = parseRet.queryObject;
    let parameters = parseRet.parameters;
    assert.equal(qCode, '{"name": name}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'name');
    assert.equal(parameters[0].value, '"Joey"');

    code = esprima.parseScript('db.test.find({"first": "Joey", "last": "Zhao"})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{"first": first,"last": last}');
    assert.equal(parameters.length, 2);
    assert.equal(parameters[0].name, 'first');
    assert.equal(parameters[0].value, '"Joey"');
    assert.equal(parameters[1].name, 'last');
    assert.equal(parameters[1].value, '"Zhao"');
  });

  it('test parse nested json query parameters', () => {
    let code = esprima.parseScript('db.test.find({"name": "Joey", "full-name": {"last": "zhao", "first": "yi"}})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    let qCode = parseRet.queryObject;
    let parameters = parseRet.parameters;
    assert.equal(qCode, '{"name": name,"full-name": {"last": last,"first": first}}');
    assert.equal(parameters.length, 3);
    assert.equal(parameters[0].name, 'name');
    assert.equal(parameters[0].value, '"Joey"');
    assert.equal(parameters[1].name, 'last');
    assert.equal(parameters[1].value, '"zhao"');
    assert.equal(parameters[2].name, 'first');
    assert.equal(parameters[2].value, '"yi"');

    code = esprima.parseScript('db.test.find({"age": 100, "nested1": {"key1": 1, "nested2": {"key2": 2, "nested3": {"key3": "key3"}}}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{"age": age,"nested1": {"key1": key1,"nested2": {"key2": key2,"nested3": {"key3": key3}}}}');
    assert.equal(parameters.length, 4);
    assert.equal(parameters[0].name, 'age');
    assert.equal(parameters[0].value, 100);
    assert.equal(parameters[1].name, 'key1');
    assert.equal(parameters[1].value, 1);
    assert.equal(parameters[2].name, 'key2');
    assert.equal(parameters[2].value, 2);
    assert.equal(parameters[3].name, 'key3');
    assert.equal(parameters[3].value, '"key3"');
  });

  it('test parse query more than 4 parameters', () => {
    let code = esprima.parseScript('db.test.find({"name": "Joey", "full-name": {"last": "zhao", "first": "yi"}, "education": {"junior":"s1", "senior":"s2"}})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    let qCode = parseRet.queryObject;
    let parameters = parseRet.parameters;
    assert.equal(qCode, '{"name": q.name,"full-name": {"last": q.last,"first": q.first},"education": {"junior": q.junior,"senior": q.senior}}');
    assert.equal(parameters.length, 5);
    assert.equal(parameters[0].name, 'name');
    assert.equal(parameters[0].value, '"Joey"');
    assert.equal(parameters[1].name, 'last');
    assert.equal(parameters[1].value, '"zhao"');
    assert.equal(parameters[2].name, 'first');
    assert.equal(parameters[2].value, '"yi"');
    assert.equal(parameters[3].name, 'junior');
    assert.equal(parameters[3].value, '"s1"');
    assert.equal(parameters[4].name, 'senior');
    assert.equal(parameters[4].value, '"s2"');

    code = esprima.parseScript('db.test.find({"age": 100, "nested1": {"key1": 1, "nested2": {"key2": 2, "nested3": {"key3": "key3"}}}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{"age": q.age,"nested1": {"key1": q.key1,"nested2": {"key2": q.key2,"nested3": {"key3": q.key3}}}}');
    assert.equal(parameters.length, 4);
    assert.equal(parameters[0].name, 'age');
    assert.equal(parameters[0].value, 100);
    assert.equal(parameters[1].name, 'key1');
    assert.equal(parameters[1].value, 1);
    assert.equal(parameters[2].name, 'key2');
    assert.equal(parameters[2].value, 2);
    assert.equal(parameters[3].name, 'key3');
    assert.equal(parameters[3].value, '"key3"');
  });

  it('test parser array parameter', () => {
    let code = esprima.parseScript('db.test.find({$and: [{"first": true}, {"last": true}]})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    let qCode = parseRet.queryObject;
    let parameters = parseRet.parameters;
    assert.equal(qCode, '{$and: [{"first": first},{"last": last}]}');
    assert.equal(parameters.length, 2);
    assert.equal(parameters[0].name, 'first');
    assert.equal(parameters[0].value, 'true');
    assert.equal(parameters[1].name, 'last');
    assert.equal(parameters[1].value, 'true');

    code = esprima.parseScript('db.test.find({"name": "aaa", $and: [{"first": true}, {"last": true}], "name": "aaa"})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{"name": q.name,$and: [{"first": q.first},{"last": q.last}],"name": q.name}');
    assert.equal(parameters.length, 4);
    assert.equal(parameters[0].name, 'name');
    assert.equal(parameters[0].value, '"aaa"');
    assert.equal(parameters[1].name, 'first');
    assert.equal(parameters[1].value, 'true');
    assert.equal(parameters[2].name, 'last');
    assert.equal(parameters[2].value, 'true');
    assert.equal(parameters[3].name, 'name');
    assert.equal(parameters[3].value, '"aaa"');
  });

  it('test add operator on query', () => {
    let code = esprima.parseScript('db.test.find({$exits: {"name": true}})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    let qCode = parseRet.queryObject;
    let parameters = parseRet.parameters;
    assert.equal(qCode, '{$exits: {"name": name}}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'name');

    code = esprima.parseScript('db.test.find({age: {$gt: 20}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{age: {$gt: age}}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'age');

    code = esprima.parseScript('db.test.find({ qty: { $eq: 20 } } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    assert.equal(qCode, '{qty: {$eq: qty}}');
    parameters = parseRet.parameters;
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'qty');

    code = esprima.parseScript('db.test.find({ qty: { $gte: 20 } } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{qty: {$gte: q.qty}}');
    assert.equal(parameters[0].name, 'qty');

    code = esprima.parseScript('db.test.find({ qty: { $lt: 5 } } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{qty: {$lt: q.qty}}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'qty');

    code = esprima.parseScript('db.test.find({ qty: { $lte: 5 } } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{qty: {$lte: q.qty}}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'qty');

    code = esprima.parseScript('db.test.find({ qty: { $ne: "ne" } } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{qty: {$ne: qty}}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'qty');

    code = esprima.parseScript('db.test.find({ qty: { $ne: "ne" }, qty: {$lt: 100}, qty: {$ne: 30} } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    assert.equal(qCode, '{qty: {$ne: qty},qty: {$lt: qty},qty: {$ne: qty}}');

    code = esprima.parseScript('db.test.find({ qty: { $in: [ 5, 15 ] } })');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{qty: {$in: qty}}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'qty');

    code = esprima.parseScript('db.test.find({ qty: { $nin: [ 5, 15 ] } })');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{qty: {$nin: qty}}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'qty');

    code = esprima.parseScript('db.test.find({ qty: { $nin: [ 5, 15 ] } })');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    assert.equal(qCode, '{qty: {$nin: q.qty}}');

    code = esprima.parseScript('db.test.find({ "qty": { $gt: 15 } })');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{"qty": {$gt: qty}}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'qty');

    code = esprima.parseScript('db.test.find({ "qty": { $gt: 15 }, qty1:{$gt:10}, qty2:{$gt:20},qty3:{$gt:30},qty4:{$gt:40} })');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{"qty": {$gt: q.qty},qty1: {$gt: q.qty1},qty2: {$gt: q.qty2},qty3: {$gt: q.qty3},qty4: {$gt: q.qty4}}');
    assert.equal(parameters.length, 5);
    assert.equal(parameters[0].name, 'qty');
    assert.equal(parameters[1].name, 'qty1');
    assert.equal(parameters[2].name, 'qty2');
    assert.equal(parameters[3].name, 'qty3');
    assert.equal(parameters[4].name, 'qty4');
  });

  it('test nested parameter', () => {
    let code = esprima.parseScript('db.test.find({"user.name.last": "joey"})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    let qCode = parseRet.queryObject;
    let parameters = parseRet.parameters;
    assert.equal(qCode, '{"user.name.last": userNameLast}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'userNameLast');


    code = esprima.parseScript('db.test.find({"user.name.last": "joey", "user.age" : {$gt: 10}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '{"user.name.last": userNameLast,"user.age": {$gt: userAge}}');
    assert.equal(parameters.length, 2);
    assert.equal(parameters[0].name, 'userNameLast');
    assert.equal(parameters[1].name, 'userAge');
  });

  it('test parse array parameter', () => {
    let code = esprima.parseScript('db.test.find([{"user.name.last": "joey"}])');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    let qCode = parseRet.queryObject;
    let parameters = parseRet.parameters;
    assert.equal(qCode, '[{"user.name.last": userNameLast}]');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'userNameLast');
    assert.equal(parameters[0].value, '"joey"');

    code = esprima.parseScript('db.test.find([{"user.name.last": "joey"}])');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '[{"user.name.last": q.userNameLast}]');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'userNameLast');
    assert.equal(parameters[0].value, '"joey"');

    code = esprima.parseScript('db.test.insert([{"user.name.last": "joey"}, {"user.name.last": "yi"}])');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    parseRet = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    qCode = parseRet.queryObject;
    parameters = parseRet.parameters;
    assert.equal(qCode, '[{"user.name.last": q.userNameLast},{"user.name.last": q.userNameLast}]');
    assert.equal(parameters.length, 2);
    assert.equal(parameters[0].name, 'userNameLast');
    assert.equal(parameters[0].value, '"joey"');
  });

  it('test parse variable parameter', () => {
    let code = esprima.parseScript('db.test.find({"user.name.last": name})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let parseRet = parameterParser.parseQueryParameters(expression.arguments[0]);
    let qCode = parseRet.queryObject;
    let parameters = parseRet.parameters;
    assert.equal(qCode, '{"user.name.last": userNameLast}');
    assert.equal(parameters.length, 1);
    assert.equal(parameters[0].name, 'userNameLast');
    assert.equal(parameters[0].value, 'name');
  });
});
