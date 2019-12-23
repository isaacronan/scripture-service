const { getCollection } = require('../utils/db');

const books = getCollection('books');
const verses = getCollection('verses');

const getBooks = () => new Promise(async (resolve) => {
    (await books).find({}, { projection: { _id: 0, chapters: 0 } }).sort({ booknumber: 1 }).toArray((_err, docs) => {
        resolve(docs);
    });
});

const getBook = (booknumber) => new Promise(async (resolve) => {
    (await books).find({ booknumber }, { projection: { _id: 0, chapters: 0 } }).toArray((_err, docs) => {
        resolve(docs);
    });
});

const getChapters = (booknumber) => new Promise(async (resolve) => {
    (await books).find({ booknumber }, { projection: { _id: 0, chapters: 1 } }).toArray((_err, docs) => {
        resolve(docs);
    });
});

const getChapter = (booknumber, chapternumber) => new Promise(async (resolve) => {
    (await verses).find({ booknumber, chapternumber }, { projection: { _id: 0 } }).sort({ versenumber: 1 }).toArray((_err, docs) => {
        resolve(docs);
    });
});

module.exports = {
    getBooks,
    getBook,
    getChapters,
    getChapter
};