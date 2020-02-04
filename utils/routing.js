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

const subscriptionsFormatIsValid = (subscriptions) =>
    Array.isArray(subscriptions) &&
    subscriptions.map(sub => !!sub &&
        typeof sub.lastBook === 'number' &&
        typeof sub.lastChapter === 'number' &&
        typeof sub.lastVerse === 'number' &&
        typeof sub.verseDosage === 'number' &&
        Array.isArray(sub.bookPool) &&
        sub.bookPool.reduce((acc, bookNumber) => acc && typeof bookNumber === 'number', true))
    .reduce((acc, isValid) => acc && isValid, true);

module.exports = {
    SECRET,
    checkResultsAndRespond,
    sign,
    authenticate,
    subscriptionsFormatIsValid
};