const express = require('express');
const router = express.Router();

const { authenticate } = require('../utils/routing');
const { getNextIssue, getSubscriptions, updateSubscriptions } = require('../queries/subscriptions');

router.use(express.json());

router.get('/', authenticate, (req, res) => {
    const { username } = req.user;
    getSubscriptions(username).then((docs) => {
        res.json(docs[0].subscriptions);
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
        Promise.all(docs[0].subscriptions.map(subscription => getNextIssue(subscription))).then((results) => {
            res.json(results);
        });
    });
});

module.exports = router;