const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017/SampleCollections';

MongoClient.connect(url, async(err, db) => {
  db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray().then((docs) => {
    console.log(docs);
  });
});
