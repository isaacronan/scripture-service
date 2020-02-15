const MongoClient = require('mongodb').MongoClient;

class DatabaseService {
    connectedClient = null;

    getDb() {
        return new Promise((resolve) => {
            if (this.connectedClient && this.connectedClient.isConnected()) {
                resolve(this.connectedClient.db(process.env.DBNAME));
            } else {
                MongoClient.connect(`mongodb://${process.env.DBHOST}:${process.env.DBPORT}`, { useUnifiedTopology: true }).then((connectedClient) => {
                    this.connectedClient = connectedClient;
                    resolve(connectedClient.db(process.env.DBNAME));
                }, () => {
                    resolve(null);
                });
            }
        });
    }

    getCollection(collection) {
        return new Promise((resolve) => {
            dbService.getDb().then((db) => {
                if (db) {
                    resolve(db.collection(collection));
                } else {
                    resolve(null);
                }
            });
        });
    };
}

const dbService = new DatabaseService();

const getCollection = (collection) => new Promise((resolve) => {
    dbService.getDb().then((db) => {
        if (db) {
            resolve(db.collection(collection));
        } else {
            resolve(null);
        }
    });
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
    constructCurrentIssue,
    dbService
};
