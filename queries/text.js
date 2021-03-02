const { dbService: { getCollection }, constructBoundedVerseQuery, constructSelectedTextPipeline, constructSelectedTextResponse } = require('../utils/db');

const getBooks = () => getCollection('books').then((books) => {
    return books.find({}, { projection: { _id: 0, booknumber: 1, shortname: 1, contentsname: 1, bookname: 1, bookdesc: 1 } }).sort({ booknumber: 1 }).toArray().then((docs) => {
        return docs;
    });
});

const getBook = (booknumber) => getCollection('books').then((books) => {
    return books.findOne({ booknumber }, { projection: { _id: 0, booknumber: 1, shortname: 1, contentsname: 1, bookname: 1, bookdesc: 1, chapters: 1 } }).then((doc) => {
        return doc;
    });
});

const getChapters = (booknumber, numberOnly = false) => getCollection('books').then((books) => {
    return books.aggregate([
        { $match: { booknumber }},
        { $unwind: '$chapters' },
        { $replaceRoot: { newRoot: '$chapters' }},
        ...numberOnly ? [{ $project: { chapternumber: true }}] : []
    ]).toArray().then((docs) => {
        return docs;
    });
});

const getChapter = (booknumber, chapternumber, start, end, numberOnly = false) => getCollection('verses').then((verses) => {
    return verses.find({ booknumber, chapternumber, ...constructBoundedVerseQuery(start, end) }, { projection: { _id: 0, ...numberOnly ? { versenumber: 1 } : {} }}).sort({ versenumber: 1 }).toArray().then((docs) => {
        return docs;
    });
});

const getVerse = (booknumber, chapternumber, versenumber) => getCollection('verses').then((verses) => {
    return verses.findOne({ booknumber, chapternumber , versenumber}, { projection: { _id: 0 } }).then((doc) => {
        return doc;
    });
});

const getSelectedText = (verseRanges) => getCollection('verses').then((verses) => {
    return verses.aggregate(constructSelectedTextPipeline(verseRanges)).toArray().then((docs) => {
        return constructSelectedTextResponse(verseRanges, docs);
    });
});

const createFeedback = (feedbackReport) => getCollection('feedback').then((feedback) => {
    return feedback.insertOne({ ...feedbackReport, timestamp: Date.now() }).then(({ result }) => {
        return result.n;
    });
});

module.exports = {
    getBooks,
    getBook,
    getChapters,
    getChapter,
    getVerse,
    createFeedback,
    getSelectedText
};