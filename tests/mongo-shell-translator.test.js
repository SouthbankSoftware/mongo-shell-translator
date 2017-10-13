const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;

describe('test generate translator', () => {
  it('test complicated scripts1', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('use SampleCollections; \n' +
      'db.people.drop(); \n' +
      'var cust=db.Sakila_customers.find().toArray();\n' +
      'var docCount=1000000; \n' +
      'var docs=[];\n' +
      'for (var i=1;i<=docCount;i++) {  \n' +
      '  var d = new Date();\n' +
      '  var r1=Math.round(Math.random()*100);\n' +
      '  var r2=Math.round(Math.random()*100);\n' +
      '  var r3=Math.round(Math.random()*10*365);\n' +
      '  var r4=Math.round(Math.random()*50);\n' +
      '  var sn=cust[r1]["Last Name"];\n' +
      '  var fn=cust[r2]["First Name"];\n' +
      '  var dob=d.setDate(d.getDate()-(20*365)+r3);\n' +
      '  var tel=cust[r4]["Phone"];\n' +
      '  var p={Firstname:fn,Surname:sn,dob:new Date(dob), tel:tel}; \n' +
      '  docs.push(p); \n' +
      '};\n' +
      'var results=db.people.insertMany(docs); \n' +
      'db.people.count();\n' +
      'db.people.dropIndexes();\n' +
      'db.people.createIndex({ "Surname":1 }  );\n' +
      'db.people.createIndex({ "Surname":1 ,"Firstname":1}  );\n' +
      'db.people.createIndex({ "Surname":1 ,"Firstname":1,"dob":1}  );\n' +
      'db.people.createIndex({ "Surname":1 ,"Firstname":1,"dob":1,"tel":1}  );');
    const expected = 'function dropCollection(db, collectionName) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const ret = useDb.dropCollection(collectionName);\n' +
      '                resolve(ret);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'function Sakila_customersFind(db) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '    const query = {};\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'Sakila_customers\').find(query).limit(20).toArray();\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'function peopleInsertMany(db, docs) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '    const doc = docs;\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'people\').insertMany(doc);\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'function peopleCreateIndex(db, surname) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '    const query = { \'Surname\': surname };\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'people\').createIndex(query);\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'function peopleCreateIndex1(db, surname, firstname) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '    const query = {\n' +
      '        \'Surname\': surname,\n' +
      '        \'Firstname\': firstname\n' +
      '    };\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'people\').createIndex(query);\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'function peopleCreateIndex2(db, surname, firstname, dob) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '    const query = {\n' +
      '        \'Surname\': surname,\n' +
      '        \'Firstname\': firstname,\n' +
      '        \'dob\': dob\n' +
      '    };\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'people\').createIndex(query);\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'function peopleCreateIndex3(db, surname, firstname, dob, tel) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '    const query = {\n' +
      '        \'Surname\': surname,\n' +
      '        \'Firstname\': firstname,\n' +
      '        \'dob\': dob,\n' +
      '        \'tel\': tel\n' +
      '    };\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'people\').createIndex(query);\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'new Promise(resolve => {\n' +
      '    const results = dropCollection(db, \'people\');\n' +
      '    resolve(results);\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '    const result1 = Sakila_customersFind(db);\n' +
      '    return result1;\n' +
      '}).then(cust => {\n' +
      '    cust.forEach(doc => {\n' +
      '        console.log(JSON.stringify(doc));\n' +
      '    });\n' +
      '    var docCount = 1000000;\n' +
      '    var docs = [];\n' +
      '    for (var i = 1; i <= docCount; i++) {\n' +
      '        var d = new Date();\n' +
      '        var r1 = Math.round(Math.random() * 100);\n' +
      '        var r2 = Math.round(Math.random() * 100);\n' +
      '        var r3 = Math.round(Math.random() * 10 * 365);\n' +
      '        var r4 = Math.round(Math.random() * 50);\n' +
      '        var sn = cust[r1][\'Last Name\'];\n' +
      '        var fn = cust[r2][\'First Name\'];\n' +
      '        var dob = d.setDate(d.getDate() - 20 * 365 + r3);\n' +
      '        var tel = cust[r4][\'Phone\'];\n' +
      '        var p = {\n' +
      '            Firstname: fn,\n' +
      '            Surname: sn,\n' +
      '            dob: new Date(dob),\n' +
      '            tel: tel\n' +
      '        };\n' +
      '        docs.push(p);\n' +
      '    }\n' +
      '    ;\n' +
      '    const results1 = peopleInsertMany(db, docs);\n' +
      '    return results1;\n' +
      '}).then(results => {\n' +
      '    console.log(JSON.stringify(results));\n' +
      '    db.people.count();\n' +
      '    db.people.dropIndexes();\n' +
      '    const result1 = peopleCreateIndex(db, 1);\n' +
      '    return result1;\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '    const result1 = peopleCreateIndex1(db, 1, 1);\n' +
      '    return result1;\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '    const result1 = peopleCreateIndex2(db, 1, 1, 1);\n' +
      '    return result1;\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '    const result1 = peopleCreateIndex3(db, 1, 1, 1, 1);\n' +
      '    return result1;\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '}).catch(err => {\n' +
      '    console.error(err);\n' +
      '});';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });
});
