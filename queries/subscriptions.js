const uuid = require('uuid');
const { dbService: { getCollection }, constructIssuePipeline, constructIssueResponse, constructCurrentIssue } = require('../utils/db');

const getCurrentIssue = (subscription) => getCollection('verses').then((verses) => {
    return verses.aggregate(constructIssuePipeline(subscription)).toArray().then((docs) => {
        return constructIssueResponse(subscription, docs);
    });
});

const getSubscriptions = (username) => getCollection('subscriptions').then((subscriptions) => {
    return subscriptions.find({ username }, { projection: { _id: 0, username: 0 }}).toArray().then((docs) => {
        return docs;
    });
});

const getSubscription = (username, id) => getCollection('subscriptions').then((subscriptions) => {
    return subscriptions.findOne({ username, id }, { projection: { _id: 0, username: 0, id: 0 }}).then((doc) => {
        return doc;
    });
});

const updateSubscription = (username, id, subscription) => getCollection('subscriptions').then((subscriptions) => {
    return subscriptions.updateOne({ username, id }, { $set: { ...subscription }}).then(({ result }) => {
        return result.n;
    });
});

const createSubscription = (username, subscription) => getCollection('subscriptions').then((subscriptions) => {
    const id = uuid.v4();
    return subscriptions.insertOne({ username, id, ...subscription, currentIssue: constructCurrentIssue(subscription) }).then(() => {
        return id;
    });
});

const deleteSubscription = (username, id) => getCollection('subscriptions').then((subscriptions) => {
    return subscriptions.deleteMany({ username, id }).then(({ result }) => {
        return result.n;
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