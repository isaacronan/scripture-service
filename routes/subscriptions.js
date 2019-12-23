const express = require('express');
const router = express.Router();

const { getNextIssue } = require('../queries/subscriptions');

router.use(express.json());

router.post('/', (req, res) => {
    const { subscriptions } = req.body;
    
    Promise.all(subscriptions.map(subscription => getNextIssue(subscription))).then((results) => {
        res.json(results);
    });
});

module.exports = router;