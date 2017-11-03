const MongoClient = require('mongodb').MongoClient;
const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');
const babel = require('babel-core');

const url = 'mongodb://test:test@localhost:28017/admin';

const aggregateTest = (db) => {
  // db.collection('explains').aggregate([], { explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true }).toArray((err, docs) => {
  //   console.log(docs);
  // });
  db.collection('explains').aggregate([], { explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true }).toArray().then((docs) => {
    console.log(docs);
  });
  // db.collection('enron_messages').aggregate([
  //   { $match: { $and: [{ 'headers.To': { $ne: '' } }] } },
  //   { $unwind: '$subFolder' },
  //   {
  //     $group: {
  //       _id: { filename: '$filename' },
  //       count: { $sum: 1 },
  //       'headers-sum': { $sum: '$headers' },
  //     },
  //   },
  // ], { allowDiskUse: true }).toArray().then((docs) => {
  //   console.log(docs);
  // });
};

const updateTest = async(db) => {
  // db.collection('explains').updateOne({}, {}, {}, (docs) => {
  //   console.log('doc:', docs);
  // });
  // db.collection('test').updateOne({ a: 1 }, { b: 2, a: 1 }, (err, docs) => {
  //   console.log(docs);
  // });
  // db.collection('collection').updateOne({ name: 'Central Perk Cafe' }, { $set: { violations: 3 } }, (err, r) => {
  //   console.log(r);
  // });

  // db.collection('explains').updateOne({ name: 'Central Perk Cafe' }, {}).then((r) => {
  //   console.log(r);
  // });
  const r = await db.collection('explains').updateOne({ name: 'Central Perk Cafe' }, {});
  console.log(r);
};

const deleteTest = async(db) => {
  // db.collection('explains').deleteOne({ 'user.name.last': 'Lee' }, (err, r) => {
  //   console.log(r);
  // });
  // db.collection('explains').deleteOne({ 'user.name.last': 'Lee' }, { w: 1, wtimeout: 400, j: false }, (err, r) => {
  //   console.log(r);
  // });
  // db.collection('explains').deleteOne({}).then((r) => {
  //   console.log(r);
  // });

  // db.collection('explains').deleteOne({ 'user.name.last': 'Lee' }).then((r) => {
  //   console.log(r);
  // });

  // db.collection('explains').deleteOne({ 'user.name.last': 'Lee' }, { w: 1, wtimeout: 400, j: false }).then((r) => {
  //   console.log(r);
  // });
  // eval("const r = await db.collection('explains').deleteOne({ 'user.name.last': 'Lee' }, { w: 1, wtimeout: 400, j: false }); console.log(r);");

  const ret = eval(testFind(db, 'Lee', {}, 10, 10, 10));

  // const aaa = eval(" db.collection('explains').find().toArray().then((doc) => console.log(doc))");
  // console.log(aaa);
};
const str = "function explainsFind(db, userNameLast, fields, limit, skip, batchSize) {\
    const useDb = db.db('SampleCollections');\
    const query = { 'user.name.last': userNameLast };\
        const returnData = new Promise(resolve => {\
                const arrayData = useDb.collection('explains').find(query).project({ _id: 0 }).limit(1).skip(1).batchSize(1000).toArray();\
                resolve(arrayData);\
    });\
    return (returnData);\
}\
const explainsFind(db, 'Lee', 10, 100, 1000);\
";

const userFind = 'function usersFind(db, userAge, userNameLast) {\
  const useDb = db.db("test");\
  const query = {\
    "user.age": { $gt: userAge },\
    "user.name.last": userNameLast\
  };\
  const returnData = new Promise(resolve => {\
    const arrayData = useDb.collection("users").find(query).limit(1).toArray();\
    resolve(arrayData);\
  });\
  return returnData;\
}\
let results = usersFind(db, 5, "Lee", 1);\
results.then(r => {\
  r.forEach(doc => {\
    console.log(JSON.stringify(doc));\
  });\
});\
results = usersFind(db, 5, "Lee", 1);\
results.then(r => {\
  r1.forEach(doc => {\
    console.log(JSON.stringify(doc));\
  });\
});\
';

function explainsFind(db, userNameLast, fields, limit, skip, batchSize) {
  const useDb = db.db('SampleCollections');
  const query = { 'user.name.last': userNameLast };
  const returnData = new Promise((resolve) => {
    const arrayData = useDb.collection('explains').find(query).project({ _id: 0 }).limit(10).skip(100).batchSize(1000).toArray();
    resolve(arrayData);
  });
  return (returnData);
}

function testFind(db) {
  const useDb = db.db('SampleCollections');
  const query = {};
  const returnData = new Promise((resolve) => {
    const arrayData = useDb.collection('test').find(query).limit(20).toArray();
    resolve(arrayData);
  });
  return (returnData);
}

function testUpdateOne(db, name, nameUpdated, options) {
  const useDb = db.db('SampleCollections');
  const query = { name };
  const update = { name: nameUpdated };
  const returnData = new Promise((resolve) => {
    const data = useDb.collection('test').updateOne(query, update, options);
    resolve(data);
  });
  return (returnData);
}
const str1 = 'let ret = await db.db("SampleCollections").collection("test").find() \n console.log(ret)\n';

const str2 = "\
const testFun = async (db) => {\
  let ret = await db.db('SampleCollections').collection('test').find();\
  console.log(ret);\
};\
testFun(db);\
";
// console.log(babel.transform(str2, { presets: ['stage-0'] }).code);

const testFun = async(db) => {
  let ret = await db.db('SampleCollections').collection('test').find();
  console.log(ret);
};

MongoClient.connect(url, {}, async(err, db) => {
  db.db('admin').command({ rolesInfo: 1, showBuiltinRoles: true })
    .then((roleList) => {
      console.log('role list', roleList);
    })
    .catch((err) => {
      console.error(err);
    });
});
