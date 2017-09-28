const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:28017/test';
MongoClient.connect(url, {}, async(err, db) => {
  db.db('admin').authenticate('test', 'testpwd')
    .then((ret) => {
      console.log('auth ', ret);
    }).catch((e) => {
      console.error(e);
    });
});
