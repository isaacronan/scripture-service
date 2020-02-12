const uuid = require('uuid');
const { getCollection, constructIssuePipeline, constructIssueResponse } = require('../utils/db');

const verses = getCollection('verses');
const subscriptions = getCollection('subscriptions');

const getCurrentIssue = (username, id) => new Promise(async (resolve, reject) => {
    const subscription = await getSubscription(username, id);
    if (!subscription) {
        reject();
    } else {
        (await verses).aggregate(constructIssuePipeline(subscription)).toArray((_err, docs) => {
            resolve(constructIssueResponse(subscription, docs));
        });
    }
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