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

const constructIssuePipeline = (subscription) => {
    const { verseDosage, bookPool, currentIssue } = subscription;
    const { currentBook, currentChapter, currentVerse } = currentIssue;
    const pipeline = [
        { $match: { $and: [
            { booknumber: { $in: bookPool }},
            { $or: [
                { booknumber: { $gt: currentBook }},
                { booknumber: currentBook, chapternumber: { $gt: currentChapter }},
                { booknumber: currentBook, chapternumber: currentChapter, versenumber: { $gte: currentVerse }},
            ]}
        ]}},
        { $sort: { booknumber: 1, chapternumber: 1, versenumber: 1 }},
        { $limit:  verseDosage + 1 },
        { $project: { _id: false }}
    ];

    return pipeline;
};

const constructIssueResponse = (subscription, docs) => {
    const { verseDosage, bookPool, currentIssue, name } = subscription;
    const content = docs.slice(0, verseDosage);
    const nextIssue = docs.length === verseDosage + 1 ? {
        currentBook: docs[verseDosage].booknumber,
        currentChapter: docs[verseDosage].chapternumber,
        currentVerse: docs[verseDosage].versenumber
    } : null;

    return { name, verseDosage, bookPool, currentIssue, nextIssue, content };
}

const constructCurrentIssue = (subscription) => ({
    currentBook: subscription.bookPool[0],
    currentChapter: 1,
    currentVerse: 1
});

module.exports = {
    getCollection,
    constructIssuePipeline,
    constructIssueResponse,
    constructCurrentIssue
};
