const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(`mongodb://${process.env.DBHOST}:27017`, { useUnifiedTopology: true });
const DBNAME = 'scripture';

let db;
const getDb = () => new Promise((resolve) => {
    if (db) {
        resolve(db);
    }

    client.connect(() => {
        db = client.db(DBNAME);
        resolve(db);
    });
});

const getCollection = (collection) => new Promise(async (resolve) => {
    const db = await getDb();
    resolve(db.collection(collection));
});

module.exports = {
    getCollection
};
