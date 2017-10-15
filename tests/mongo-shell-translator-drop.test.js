const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;

describe('test drop translator', () => {
  it('test drop collection', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('db.test.drop()');
    const expected = 'function dropCollection(db, collectionName) {\n' +
      '    const useDb = db;\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const ret = useDb.dropCollection(collectionName);\n' +
      '                resolve(ret);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'const results = dropCollection(db, \'test\');\n' +
      'results.then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '}).catch(err => console.error(err));';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });

  it('test drop promise chain', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('db.test1.drop()\n db.test2.drop()');
    const expected = 'function dropCollection(db, collectionName) {\n' +
      '    const useDb = db;\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const ret = useDb.dropCollection(collectionName);\n' +
      '                resolve(ret);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'new Promise(resolve => {\n' +
      '    const results = dropCollection(db, \'test1\');\n' +
      '    resolve(results);\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '    const results = dropCollection(db, \'test2\');\n' +
      '    return results;\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '}).catch(err => {\n' +
      '    console.error(err);\n' +
      '});';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });

  it('test drop indexes', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('db.people.dropIndexes()');
    const expected = 'function peopleDropIndexes(db) {\n' +
      '    const useDb = db;\n' +
      '    const query = {};\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'people\').dropIndexes(query);\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'const results = peopleDropIndexes(db);\n' +
      'results.then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '}).catch(err => console.error(err));';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });
});
