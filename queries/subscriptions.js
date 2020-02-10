const uuid = require('uuid');
const { getCollection } = require('../utils/db');

const verses = getCollection('verses');
const subscriptions = getCollection('subscriptions');

const getCurrentIssue = (username, id) => new Promise(async (resolve) => {
    const { subscription } = await getSubscription(username, id);
    const { lastBook, lastChapter, lastVerse, verseDosage, bookPool } = subscription;
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
    (await subscriptions).find({ username }, { projection: { _id: 0, subscription: 1, id: 1 }}).toArray((_err, docs) => {
        resolve(docs);
    });
});

const getSubscription = (username, id) => new Promise(async (resolve) => {
    (await subscriptions).find({ username, id }, { projection: { _id: 0, subscription: 1 }}).toArray((_err, docs) => {
        resolve(docs[0]);
    });
});

const updateSubscription = (username, subscription, id) => new Promise(async (resolve) => {
    (await subscriptions).updateOne({ username, id }, { $set: { subscription } }).then(({ result }) => {
        resolve(result.n);
    });
});

const createSubscription = (username, subscription) => new Promise(async (resolve) => {
    const id = uuid.v4();
    (await subscriptions).insertOne({ username, subscription, id }).then(() => {
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