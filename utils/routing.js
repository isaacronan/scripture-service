const passport = require('passport');
const jwt = require('jsonwebtoken');

const SECRET = 'secret';

const checkResultsAndRespond = (res) => (results) => {
    if (results.length) {
        res.json(results);
    } else {
        res.status(404).send({ error: 'No results found!' });
    }
};

const sign = payload => jwt.sign(payload, SECRET, { expiresIn: 30 * 60 });

const authenticate = passport.authenticate('jwt', { session: false });

const subscriptionFormatIsValid = (subscription) =>
    !!subscription &&
    typeof subscription.lastBook === 'number' &&
    typeof subscription.lastChapter === 'number' &&
    typeof subscription.lastVerse === 'number' &&
    typeof subscription.verseDosage === 'number' &&
    Array.isArray(subscription.bookPool) &&
    subscription.bookPool.reduce((acc, bookNumber) => acc && typeof bookNumber === 'number', true)

module.exports = {
    SECRET,
    checkResultsAndRespond,
    sign,
    authenticate,
    subscriptionFormatIsValid
};