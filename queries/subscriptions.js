const { getCollection } = require('../utils/db');

const verses = getCollection('verses');
const users = getCollection('users');

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

const getSubscriptions = (username) => new Promise(async (resolve) => {
    (await users).find({ username }, { projection: { _id: 0, subscriptions: 1 }}).toArray((_err, docs) => {
        resolve(docs);
    });
});

const updateSubscriptions = (username, subscriptions) => new Promise(async (resolve) => {
    (await users).updateOne({ username }, { $set: { subscriptions } }).then(({ result }) => {
        resolve(result.n);
    });
});

module.exports = {
    getNextIssue,
    getSubscriptions,
    updateSubscriptions
};