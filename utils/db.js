const MongoClient = require('mongodb').MongoClient;

class DatabaseService {
    connectedClient = null;

    getDb() {
        if (this.connectedClient && this.connectedClient.isConnected()) {
            return Promise.resolve(this.connectedClient.db(process.env.DBNAME));
        }

        return MongoClient.connect(`mongodb://${process.env.DBHOST}:${process.env.DBPORT}`, { useUnifiedTopology: true }).then((connectedClient) => {
            this.connectedClient = connectedClient;
            return connectedClient.db(process.env.DBNAME);
        }).catch(() => {
            console.log('could not connect to database...');
        });
    }

    getCollection(collection) {
        return dbService.getDb().then((db) => {
            return db.collection(collection);
        });
    };
}

const dbService = new DatabaseService();

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
    const { verseDosage, bookPool, name } = subscription;
    const content = docs.slice(0, verseDosage);
    const currentIssue = docs.length ? {
        currentBook: content[0].booknumber,
        currentChapter: content[0].chapternumber,
        currentVerse: content[0].versenumber,
    } : null;
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
    constructIssuePipeline,
    constructIssueResponse,
    constructCurrentIssue,
    dbService
};
