const MongoClient = require('mongodb').MongoClient;

class DatabaseService {
    connectedClient = null;

    getDb() {
        const { DBHOST = 'localhost', DBPORT = 27017, DBNAME = 'scripture', DBUSERNAME = '', DBPASSWORD = '' } = process.env;
        if (this.connectedClient && this.connectedClient.isConnected()) {
            return Promise.resolve(this.connectedClient.db(DBNAME));
        }

        const url = (DBUSERNAME && DBPASSWORD) ? `mongodb://${DBUSERNAME}:${DBPASSWORD}@${DBHOST}:${DBPORT}?authMechanism=DEFAULT` : `mongodb://${DBHOST}:${DBPORT}`;
        return MongoClient.connect(url, { useUnifiedTopology: true }).then((connectedClient) => {
            this.connectedClient = connectedClient;
            return connectedClient.db(DBNAME);
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

const constructVerseIssuePipeline = (subscription) => {
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
        { $project: { _id: false }},
        { $group: {
            _id: { booknumber: '$booknumber', chapternumber: '$chapternumber' },
            verses: { $push: '$$ROOT' }
        }},
        { $sort: {
            '_id.booknumber': 1,
            '_id.chapternumber': 1
        }},
        { $group: {
            _id: { booknumber: '$_id.booknumber' },
            chapters: { $push: { chapternumber: '$_id.chapternumber', verses: '$verses' } }
        }},
        { $sort: {
            '_id.booknumber': 1
        }},
        { $project: {
            _id: false,
            booknumber: '$_id.booknumber',
            chapters: '$chapters'
        }}
    ];

    return pipeline;
};

const constructVerseIssueResponse = (subscription, docs) => {
    const { verseDosage, bookPool, name, currentIssue } = subscription;
    const flattenedDocs = docs
        .reduce((acc, book) => [...acc, ...book.chapters], [])
        .reduce((acc, chapter) => [...acc, ...chapter.verses], []);
    const nextIssue = flattenedDocs.length === verseDosage + 1 ? {
        currentBook: flattenedDocs[verseDosage].booknumber,
        currentChapter: flattenedDocs[verseDosage].chapternumber,
        currentVerse: flattenedDocs[verseDosage].versenumber
    } : null;

    const books = [...docs];
    if (nextIssue) {
        const lastBook = books[books.length - 1];
        const lastChapter = lastBook.chapters[lastBook.chapters.length - 1];
        lastChapter.verses.pop();
        if (!lastChapter.verses.length) {
            lastBook.chapters.pop();
            if (!lastBook.chapters.length) {
                books.pop();
            }
        }
    }

    return { name, verseDosage, bookPool, currentIssue, nextIssue, books };
};

const constructChapterIssuePipeline = (subscription) => {
    const { verseDosage, bookPool, currentIssue } = subscription;
    const { currentBook, currentChapter } = currentIssue;
    const pipeline = [
        { $match: { $and: [
            { booknumber: { $in: bookPool }},
            { $or: [
                { booknumber: { $gt: currentBook }},
                { booknumber: currentBook, chapternumber: { $gte: currentChapter }},
            ]}
        ]}},
        { $sort: { booknumber: 1, chapternumber: 1 }},
        { $project: { _id: false }},
        { $group: {
            _id: { booknumber: '$booknumber', chapternumber: '$chapternumber' },
            verses: { $push: '$$ROOT' }
        }},
        { $sort: {
            '_id.booknumber': 1,    
            '_id.chapternumber': 1
        }},
        { $limit: verseDosage + 1 },
        { $group: {
            _id: { booknumber: '$_id.booknumber' },
            chapters: { $push: { chapternumber: '$_id.chapternumber', verses: '$verses' } }
        }},
        { $sort: {
            '_id.booknumber': 1
        }},
        { $project: {
            _id: false,
            booknumber: '$_id.booknumber',
            chapters: '$chapters'
        }}
    ];

    return pipeline;
};

const constructChapterIssueResponse = (subscription, docs) => {
    const { verseDosage: chapterDosage, bookPool, name, currentIssue } = subscription;
    const flattenedDocs = docs
        .reduce((acc, { booknumber, chapters }) => [...acc, ...chapters.map(chapter => ({ booknumber, ...chapter }))], []);
    const nextIssue = flattenedDocs.length === chapterDosage + 1 ? {
        currentBook: flattenedDocs[chapterDosage].booknumber,
        currentChapter: flattenedDocs[chapterDosage].chapternumber,
        currentVerse: 1
    } : null;

    const books = [...docs];
    if (nextIssue) {
        const lastBook = books[books.length - 1];
        lastBook.chapters.pop();
        if (!lastBook.chapters.length) {
            books.pop();
        }
    }

    return { name, verseDosage: chapterDosage, bookPool, currentIssue, nextIssue, books };
};

const constructIssuePipeline = (subscription) => (subscription.isChapterSubscription ?
    constructChapterIssuePipeline : constructVerseIssuePipeline)(subscription);

const constructIssueResponse = (subscription, docs) => (subscription.isChapterSubscription ?
    constructChapterIssueResponse : constructVerseIssueResponse)(subscription, docs);

const constructCurrentIssue = (subscription) => ({
    currentBook: subscription.bookPool[0],
    currentChapter: 1,
    currentVerse: 1
});

const constructBoundedVerseQuery = (start, end) => start || end ? { versenumber: {
    ...start ? { $gte: start }: {},
    ...end ? { $lte: end } : {}
}} : {};

const orderFavorite = ({ booknumber, chapternumber, start, end }) => ({
    booknumber,
    chapternumber,
    start,
    end
});

const orderFavorites = favorites => favorites.map(orderFavorite);

module.exports = {
    constructIssuePipeline,
    constructIssueResponse,
    constructCurrentIssue,
    dbService,
    constructBoundedVerseQuery,
    orderFavorite,
    orderFavorites
};
