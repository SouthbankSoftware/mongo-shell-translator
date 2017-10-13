const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost/SampleCollections';
MongoClient.connect(url, {}, async(err, db) => {
  const results = db.db('SampleCollections').collection('explains').find().toArray();
  results.then((r) => {
    console.log(r[0].tags);
  });
});
