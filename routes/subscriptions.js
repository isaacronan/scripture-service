const express = require('express');
const router = express.Router();

const { authenticate, subscriptionFormatIsValid } = require('../utils/routing');
const { getCurrentIssue, getSubscriptions, createSubscription, updateSubscription, deleteSubscription } = require('../queries/subscriptions');

router.use(express.json());

router.get('/', authenticate, (req, res) => {
    const { username } = req.user;
    getSubscriptions(username).then((docs) => {
        res.json(docs);
    });
});
    
router.post('/', authenticate, (req, res) => {
    const { username } = req.user;
    const subscription = req.body;

    if (!subscriptionFormatIsValid(subscription)) {
        res.status(400).json({ error: 'Request format is invalid.' });
        return;
    }

    if (!subscription.name || !subscription.verseDosage || !subscription.bookPool) {
        res.status(400).json({ error: 'Request is missing required fields.' });
        return;
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
        return;
    }

    updateSubscription(username, id, subscription).then((numUpdated) => {
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

router.get('/:id', authenticate, (req, res) => {
    const { username } = req.user;
    const { id } = req.params;
    getCurrentIssue(username, id).then((result) => {
        res.json(result);
    });
});

module.exports = router;