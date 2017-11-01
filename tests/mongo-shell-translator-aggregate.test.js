const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;

describe('test generate translator', () => {
  it('test complicated scripts1', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('db.getSiblingDB("SampleCollections").crunchbase_database.aggregate()');
    console.log(nativeCode);
    const expected = 'function crunchbase_databaseAggregate(db) { \
      const useDb = db.db(\'SampleCollections\');\
      const query = [{ $limit: 20 }]; \
          const returnData = new Promise(resolve => {\
                  const arrayData = useDb.collection(\'crunchbase_database\').aggregate(query);\
                  resolve(arrayData);\
      });\
      return (returnData);\
  }\
  const results = crunchbase_databaseAggregate(db);\
  results.then(r => {\
      r.forEach(doc => {\
          console.log(JSON.stringify(doc));\
      });\
  }).catch(err => console.error(err));';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });
});
