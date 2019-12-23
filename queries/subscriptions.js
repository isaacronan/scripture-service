const { getCollection } = require('../utils/db');

const verses = getCollection('verses');

const getNextIssue = ({ lastBook, lastChapter, lastVerse, verseDosage, bookPool }) => new Promise(async (resolve) => {
    const pipeline = [
        { $match: { $and: [
            { booknumber: { $in: bookPool }},
            { $or: [
                { booknumber: { $gt: lastBook }},
                { booknumber: lastBook, chapternumber: { $gt: lastChapter }},
                { booknumber: lastBook, chapternumber: lastChapter, versenumber: { $gt: lastVerse }},
            ]}
        ]}},
        { $sort: { booknumber: 1, chapternumber: 1, versenumber: 1 }},
        { $limit:  verseDosage },
        { $project: { _id: false }}
    ];
    
    (await verses).aggregate(pipeline).toArray((_err, docs) => {
        resolve(docs);
    });
});

module.exports = {
    getNextIssue
};