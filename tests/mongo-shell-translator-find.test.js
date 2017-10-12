const assert = require('assert');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const esprima = require('esprima');
const Context = require('../src/context');
const escodegen = require('escodegen');

describe('test mongo shell translator', () => {
  it('test find parameter with variable value', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('const last = \'Lee\';const age = 10;db.getSiblingDB("SampleCollections").explains.find({\'user.name.last\': last, \'user.age\': {$gt: age}});');
    const expected = 'const last = "Lee";\n' +
      'const age = 10;\n' +
      'function explainsFind(db, userNameLast, gtUserAge) {\n' +
      '    const useDb = db.db("SampleCollections");\n' +
      '    const query = {\n' +
      '      "user.name.last": userNameLast,\n' +
      '      "user.age": { $gt: gtUserAge }\n' +
      '    };\n' +
      '    const returnData = new Promise(resolve => {\n' +
      '      const arrayData = useDb\n' +
      '        .collection("explains")\n' +
      '        .find(query)\n' +
      '        .limit(20)\n' +
      '        .toArray();\n' +
      '      resolve(arrayData);\n' +
      '    });\n' +
      '    return returnData;\n' +
      '  }\n' +
      'const results = explainsFind(db, last, age);\n' +
      'results.then(r => {\n' +
      '  r.forEach(doc => {\n' +
      '    console.log(JSON.stringify(doc));\n' +
      '  });\n' +
      '}).catch(err => console.error(err));';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });

  it('test find with nested or and query', () => {
    const translator = new MongoShellTranslator();
    const code = 'use SampleCollections\n' +
      '\n' +
      'db.Sakila_films.find(\n' +
      '  {  "$and":[\n' +
      '         { "Category":{ $eq:"Family" } } ,\n' +
      '         { "Rating":{ $ne:"R" } } \n' +
      '        ]  });';
    const expected = 'function Sakila_filmsFind(db, eqCategory, neRating) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '    const query = {\n' +
      '        \'$and\': [\n' +
      '            { \'Category\': { $eq: eqCategory } },\n' +
      '            { \'Rating\': { $ne: neRating } }\n' +
      '        ]\n' +
      '    };\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'Sakila_films\').find(query).limit(20).toArray();\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'const results = Sakila_filmsFind(db, \'Family\', \'R\');\n' +
      'results.then(r => {\n' +
      '    r.forEach(doc => {\n' +
      '        console.log(JSON.stringify(doc));\n' +
      '    });\n' +
      '}).catch(err => console.error(err));';
    const native = translator.translate(code);
    assert.equal(escodegen.generate(esprima.parseScript(native)), escodegen.generate(esprima.parseScript(expected)));
  });

  it('test find with to arry in the end', () => {
    const translator = new MongoShellTranslator();
    const code = 'db.Sakila_customers.find().toArray();';
    const expected = 'function Sakila_customersFind(db) {\n' +
      '  const useDb = db;\n' +
      '  const query = {};\n' +
      '  const returnData = new Promise(resolve => {\n' +
      '    const arrayData = useDb\n' +
      '      .collection("Sakila_customers")\n' +
      '      .find(query)\n' +
      '      .limit(20)\n' +
      '      .toArray();\n' +
      '    resolve(arrayData);\n' +
      '  });\n' +
      '  return returnData;\n' +
      '}\n' +
      'const results = Sakila_customersFind(db);\n' +
      'results\n' +
      '  .then(r => {\n' +
      '    r.forEach(doc => {\n' +
      '      console.log(JSON.stringify(doc));\n' +
      '    });\n' +
      '  })\n' +
      '  .catch(err => console.error(err));\n';
    const native = translator.translate(code);
    assert.equal(escodegen.generate(esprima.parseScript(native)), escodegen.generate(esprima.parseScript(expected)));
  });
});
