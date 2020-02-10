const express = require('express');
const router = express.Router();

const { authenticate, subscriptionFormatIsValid } = require('../utils/routing');
const { getNextIssue, getSubscriptions, createSubscription, updateSubscription, deleteSubscription } = require('../queries/subscriptions');

router.use(express.json());

router.get('/', authenticate, (req, res) => {
    const { username } = req.user;
    getSubscriptions(username).then((docs) => {
        const subscriptions = docs.map(({ subscription, id }) => ({ ...subscription, id }));
        res.json(subscriptions);
    });
});
    
router.post('/', authenticate, (req, res) => {
    const { username } = req.user;
    const subscription = req.body;

    if (!subscriptionFormatIsValid(subscription)) {
        res.status(400).json({ error: 'Request format is invalid.' });
    }

    createSubscription(username, subscription).then((id) => {
        if (id) {
            res.json({ message: 'Subscription created.', id });
        } else {
            res.status(400).json({ error: 'Subscription not created.' });
        }
    });
});

router.put('/:id', authenticate, (req, res) => {
    const { username } = req.user;
    const subscription = req.body;
    const { id } = req.params;

    if (!subscriptionFormatIsValid(subscription)) {
        res.status(400).json({ error: 'Request format is invalid.' });
    }

    updateSubscription(username, subscription, id).then((numUpdated) => {
        if (numUpdated) {
            res.json({ message: 'Subscription updated.' });
        } else {
            res.status(400).json({ error: 'Subscription not updated.' });
        }
    });
});

router.delete('/:id', authenticate, (req, res) => {
    const { username } = req.user;
    const { id } = req.params;

    deleteSubscription(username, id).then((numDeleted) => {
        if (numDeleted) {
            res.json({ message: 'Subscription deleted.' });
        } else {
            res.status(400).json({ error: 'Subscription not deleted.' });
        }
    });
});

router.get('/issues', authenticate, (req, res) => {
    const { username } = req.user;
    getSubscriptions(username).then((docs) => {
        const subscriptions = docs[0].subscriptions || [];
        Promise.all(subscriptions.map(subscription => getNextIssue(subscription))).then((results) => {
            res.json(results);
        });
    });
});

module.exports = router;