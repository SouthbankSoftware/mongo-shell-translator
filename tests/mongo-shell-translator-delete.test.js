const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;

describe('test delete translator', () => {
  it('test delete collection', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('use SampleCollections\ndb.test.deleteOne({a:1})');
    const expected = 'function testDeleteOne(db, a) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '    const query = { a: a };\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'test\').deleteOne(query);\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'const results = testDeleteOne(db, 1);\n' +
      'results.then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '}).catch(err => console.error(err));';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });

  it('test drop promise chain', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('use SampleCollections \n db.test.deleteOne({a:1}); \n db.test.deleteOne({a:1})');
    const expected = 'function testDeleteOne(db, a) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '    const query = { a: a };\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'test\').deleteOne(query);\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'new Promise(resolve => {\n' +
      '    const results = testDeleteOne(db, 1);\n' +
      '    resolve(results);\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '    const result1 = testDeleteOne(db, 1);\n' +
      '    return result1;\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '}).catch(err => {\n' +
      '    console.error(err);\n' +
      '});';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });
});
