const { dbService: { getCollection }, constructIssuePipeline, constructIssueResponse, constructCurrentIssue } = require('../utils/db');

const getCurrentIssue = (subscription) => getCollection('verses').then((verses) => {
    return verses.aggregate(constructIssuePipeline(subscription)).toArray().then((docs) => {
        return constructIssueResponse(subscription, docs);
    });
});

const getSubscriptions = (username) => getCollection('subscriptions').then((subscriptions) => {
    return subscriptions.find({ username }, { projection: { _id: 0, id: 1, name: 1, verseDosage: 1, isChapterSubscription: 1, bookPool: 1, currentIssue: 1 }}).toArray().then((docs) => {
        return docs;
    });
});

const getSubscription = (username, id) => getCollection('subscriptions').then((subscriptions) => {
    return subscriptions.findOne({ username, id }, { projection: { _id: 0, name: 1, verseDosage: 1, isChapterSubscription: 1, bookPool: 1, currentIssue: 1 }}).then((doc) => {
        return doc;
    });
});

const updateSubscription = (username, id, subscription) => getCollection('subscriptions').then((subscriptions) => {
    return subscriptions.updateOne({ username, id }, [
        { $set: { ...subscription }},
        { $set: { currentIssue: {
            $switch: {
                branches: [
                    { case: { $eq: ['$currentIssue', null] }, then: null },
                    { case: { $not: [{ $in: ['$currentIssue.currentBook', '$bookPool']}] }, then: {
                        currentBook: { $arrayElemAt: ['$bookPool', 0]}, currentChapter: 1, currentVerse: 1
                    }}
                ],
                default: { currentBook: '$currentIssue.currentBook', currentChapter: '$currentIssue.currentChapter', currentVerse: '$currentIssue.currentVerse' }
            }
        }}}
    ]).then(({ result }) => {
        return result.n;
    });
});

const createSubscription = (username, subscription, id) => getCollection('subscriptions').then((subscriptions) => {
    return subscriptions.insertOne({ username, id, ...subscription, currentIssue: constructCurrentIssue(subscription) }).then(() => {
        return id;
    });
});

const deleteSubscription = (username, id) => getCollection('subscriptions').then((subscriptions) => {
    return subscriptions.deleteMany({ username, id }).then(({ result }) => {
        return result.n;
    });
});

const deleteSubscriptions = (username) => getCollection('subscriptions').then((subscriptions) => {
    return subscriptions.deleteMany({ username }).then(({ result }) => {
        return result.n;
    });
});

module.exports = {
    getCurrentIssue,
    getSubscriptions,
    getSubscription,
    updateSubscription,
    createSubscription,
    deleteSubscription,
    deleteSubscriptions
};