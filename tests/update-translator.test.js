const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const updateTranslator = require('../src/update-translator');
const commonTranslator = require('../src/common-translator');
const options = require('../src/options');
const utils = require('./utils');

describe('test update translator', () => {
  it('test update translator', () => {
    let ast = esprima.parseScript('db.test.update({"name": "joey"}, {"name":"mike"})');
    const { params, name, expression } = commonTranslator.findSupportedStatement(ast.body[0]);
    assert.equal('update', name);
    const { functionStatement, functionName, callStatement } = updateTranslator.createParameterizedFunction(ast.body[0], expression, params);
    assert.equal(callStatement.body.length, 1);
    assert.equal(functionName, 'testUpdateOne');
    assert.equal(functionStatement.id.name, 'testUpdateOne');

    ast = esprima.parseScript('db.test.udpate({"name": "joey"}, {"name":"mike"})');
  });
});
