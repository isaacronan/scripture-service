const express = require('express');
const router = express.Router();

const { authenticate } = require('../utils/routing');
const { getNextIssue, getSubscriptions, updateSubscriptions } = require('../queries/subscriptions');

router.use(express.json());

router.get('/', authenticate, (req, res) => {
    const { username } = req.user;
    getSubscriptions(username).then((docs) => {
        const subscriptions = docs[0].subscriptions || [];
        res.json(subscriptions);
    });
});

router.put('/', authenticate, (req, res) => {
    const { username } = req.user;
    const subscriptions = req.body;
    updateSubscriptions(username, subscriptions).then((numUpdated) => {
        if (numUpdated) {
            res.json({ message: 'Subscriptions updated.' });
        } else {
            res.status(400).json({ error: 'No subscriptions updated.' });
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