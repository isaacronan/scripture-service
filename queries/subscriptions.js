const uuid = require('uuid');
const { getCollection, constructIssuePipeline, constructIssueResponse, constructCurrentIssue } = require('../utils/db');

const verses = getCollection('verses');
const subscriptions = getCollection('subscriptions');

const getCurrentIssue = (subscription) => new Promise(async (resolve, reject) => {
    (await verses).aggregate(constructIssuePipeline(subscription)).toArray((_err, docs) => {
        resolve(constructIssueResponse(subscription, docs));
    });
});

const getSubscriptions = (username) => new Promise(async (resolve) => {
    (await subscriptions).find({ username }, { projection: { _id: 0, username: 0 }}).toArray((_err, docs) => {
        resolve(docs);
    });
});

const getSubscription = (username, id) => new Promise(async (resolve) => {
    (await subscriptions).findOne({ username, id }, { projection: { _id: 0, username: 0, id: 0 }}).then((doc) => {
        resolve(doc);
    });
});

const updateSubscription = (username, id, subscription) => new Promise(async (resolve) => {
    (await subscriptions).updateOne({ username, id }, { $set: { ...subscription }}).then(({ result }) => {
        resolve(result.n);
    });
});

const createSubscription = (username, subscription) => new Promise(async (resolve) => {
    const id = uuid.v4();
    (await subscriptions).insertOne({ username, id, ...subscription, currentIssue: constructCurrentIssue(subscription) }).then(() => {
        resolve(id);
    });
});

const deleteSubscription = (username, id) => new Promise(async (resolve) => {
    (await subscriptions).deleteMany({ username, id }).then(({ result }) => {
        resolve(result.n);
    });
});

module.exports = {
    getCurrentIssue,
    getSubscriptions,
    getSubscription,
    updateSubscription,
    createSubscription,
    deleteSubscription
};