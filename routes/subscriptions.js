const express = require('express');
const router = express.Router();

const { authenticate, updateSubscriptionSchema, createSubscriptionSchema, generateSubscriptionId } = require('../utils/routing');
const { logger } = require('../utils/misc');
const { getCurrentIssue, getSubscriptions, getSubscription, createSubscription, updateSubscription, deleteSubscription } = require('../queries/subscriptions');

router.use(express.json());

router.get('/', authenticate, (req, res, next) => {
    const { username } = res.locals;
    getSubscriptions(username).then((docs) => {
        res.json(docs);
    }).catch(next);
});
    
router.post('/', authenticate, async (req, res, next) => {
    const { username } = res.locals;
    const subscription = req.body;

    const validatedSubscription = await createSubscriptionSchema.validate(subscription).catch(() => null);
    
    if (!validatedSubscription) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        const id = await generateSubscriptionId(username);
        if (!id) {
            res.status(500).json({ error: 'Subscription ID could not be generated.' });
        } else createSubscription(username, validatedSubscription, id).then((id) => {
            if (id) {
                logger(`created subscription ${id} for user ${username}`);
                res.json({ message: 'Subscription created.', id });
            } else {
                res.status(400).json({ error: 'Subscription not created.' });
            }
        }).catch(next);
    }
});

router.put('/:id', authenticate, async (req, res, next) => {
    const { username } = res.locals;
    const subscription = req.body;
    const { id } = req.params;

    const validatedSubscription = await updateSubscriptionSchema.validate(subscription).catch(() => null);

    if (!validatedSubscription) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        updateSubscription(username, id, validatedSubscription).then((numUpdated) => {
            if (numUpdated) {
                logger(`updated subscription ${id} for user ${username}`);
                res.json({ message: 'Subscription updated.' });
            } else {
                res.status(400).json({ error: 'Subscription not updated.' });
            }
        }).catch(next);
    }
});

router.delete('/:id', authenticate, (req, res, next) => {
    const { username } = res.locals;
    const { id } = req.params;

    deleteSubscription(username, id).then((numDeleted) => {
        if (numDeleted) {
            logger(`deleted subscription ${id} for user ${username}`);
            res.json({ message: 'Subscription deleted.' });
        } else {
            res.status(400).json({ error: 'Subscription not deleted.' });
        }
    }).catch(next);
});

router.get('/:id', authenticate, (req, res, next) => {
    const { username } = res.locals;
    const { id } = req.params;

    getSubscription(username, id).then(async (subscription) => {
        if (!subscription) {
            res.status(404).json({ error: 'Subscription not found.' });
        } else if(subscription.currentIssue === null) {
            res.json({ ...subscription, books: [], nextIssue: null });
        } else {
            const result = await getCurrentIssue(subscription);
            res.json(result);
        }
    }).catch(next);
});

module.exports = router;