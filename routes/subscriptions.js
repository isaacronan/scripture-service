const express = require('express');
const router = express.Router();

const { authenticate, updateSubscriptionSchema, createSubscriptionSchema } = require('../utils/routing');
const { getCurrentIssue, getSubscriptions, getSubscription, createSubscription, updateSubscription, deleteSubscription } = require('../queries/subscriptions');

router.use(express.json());

router.get('/', authenticate, (req, res, next) => {
    const { username } = req.user;
    getSubscriptions(username).then((docs) => {
        res.json(docs);
    }).catch(next);
});
    
router.post('/', authenticate, async (req, res, next) => {
    const { username } = req.user;
    const subscription = req.body;

    const validatedSubscription = await createSubscriptionSchema.validate(subscription).catch(() => null);
    
    if (!validatedSubscription) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        createSubscription(username, validatedSubscription).then((id) => {
            if (id) {
                res.json({ message: 'Subscription created.', id });
            } else {
                res.status(400).json({ error: 'Subscription not created.' });
            }
        }).catch(next);
    }
});

router.put('/:id', authenticate, async (req, res, next) => {
    const { username } = req.user;
    const subscription = req.body;
    const { id } = req.params;

    const validatedSubscription = await updateSubscriptionSchema.validate(subscription).catch(() => null);

    if (!validatedSubscription) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        updateSubscription(username, id, validatedSubscription).then((numUpdated) => {
            if (numUpdated) {
                res.json({ message: 'Subscription updated.' });
            } else {
                res.status(400).json({ error: 'Subscription not updated.' });
            }
        }).catch(next);
    }
});

router.delete('/:id', authenticate, (req, res, next) => {
    const { username } = req.user;
    const { id } = req.params;

    deleteSubscription(username, id).then((numDeleted) => {
        if (numDeleted) {
            res.json({ message: 'Subscription deleted.' });
        } else {
            res.status(400).json({ error: 'Subscription not deleted.' });
        }
    }).catch(next);
});

router.get('/:id', authenticate, (req, res, next) => {
    const { username } = req.user;
    const { id } = req.params;

    getSubscription(username, id).then(async (subscription) => {
        if (!subscription) {
            res.status(404).json({ error: 'Subscription not found.' });
        } else {
            const result = await getCurrentIssue(subscription);
            res.json(result);
        }
    }).catch(next);
});

module.exports = router;