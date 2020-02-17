const { dbService: { getCollection }, constructBoundedVerseQuery } = require('../utils/db');

const getBooks = () => getCollection('books').then((books) => {
    return books.find({}, { projection: { _id: 0, chapters: 0 } }).sort({ booknumber: 1 }).toArray().then((docs) => {
        return docs;
    });
});

const getBook = (booknumber) => getCollection('books').then((books) => {
    return books.find({ booknumber }, { projection: { _id: 0, chapters: 0 } }).toArray().then((docs) => {
        return docs;
    });
});

const getChapters = (booknumber) => getCollection('books').then((books) => {
    return books.find({ booknumber }, { projection: { _id: 0, chapters: 1 } }).toArray().then((docs) => {
        return docs;
    });
});

const getChapter = (booknumber, chapternumber, start, end) => getCollection('verses').then((verses) => {
    return verses.find({ booknumber, chapternumber, ...constructBoundedVerseQuery(start, end) }, { projection: { _id: 0 } }).sort({ versenumber: 1 }).toArray().then((docs) => {
        return docs;
    });
});

const getVerse = (booknumber, chapternumber, versenumber) => getCollection('verses').then((verses) => {
    return verses.findOne({ booknumber, chapternumber , versenumber}, { projection: { _id: 0 } }).then((doc) => {
        return doc;
    });
});

module.exports = {
    getBooks,
    getBook,
    getChapters,
    getChapter,
    getVerse
};