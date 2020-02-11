const uuid = require('uuid');
const { getCollection } = require('../utils/db');

const verses = getCollection('verses');
const subscriptions = getCollection('subscriptions');

const getCurrentIssue = (username, id) => new Promise(async (resolve) => {
    const { verseDosage, bookPool, currentIssue } = await getSubscription(username, id);
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
    
    (await verses).aggregate(pipeline).toArray((_err, docs) => {
        const content = docs.slice(0, verseDosage);
        const nextIssue = docs.length === verseDosage + 1 ? {
            currentBook: docs[verseDosage].booknumber,
            currentChapter: docs[verseDosage].chapternumber,
            currentVerse: docs[verseDosage].versenumber
        } : null;
        resolve({ verseDosage, bookPool, currentIssue, nextIssue, content });
    });
});

const getSubscriptions = (username) => new Promise(async (resolve) => {
    (await subscriptions).find({ username }, { projection: { _id: 0, username: 0 }}).toArray((_err, docs) => {
        resolve(docs);
    });
});

const getSubscription = (username, id) => new Promise(async (resolve) => {
    (await subscriptions).find({ username, id }, { projection: { _id: 0, username: 0, id: 0 }}).toArray((_err, docs) => {
        resolve(docs[0]);
    });
});

const updateSubscription = (username, id, subscription) => new Promise(async (resolve) => {
    (await subscriptions).updateOne({ username, id }, { $set: { ...subscription }}).then(({ result }) => {
        resolve(result.n);
    });
});

const createSubscription = (username, subscription) => new Promise(async (resolve) => {
    const id = uuid.v4();
    const currentIssue = {
        currentBook: subscription.bookPool[0],
        currentChapter: 1,
        currentVerse: 1
    };
    
    (await subscriptions).insertOne({ username, id, ...subscription, currentIssue }).then(() => {
        resolve(id);
    });
});

const deleteSubscription = (username, id) => new Promise(async (resolve) => {
    (await subscriptions).remove({ username, id }).then(({ result }) => {
        resolve(result.n);
    });
});

module.exports = {
    getCurrentIssue,
    getSubscriptions,
    updateSubscription,
    createSubscription,
    deleteSubscription
};