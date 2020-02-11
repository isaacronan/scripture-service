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
    !!subscription && (
        !subscription.verseDosage ||
        typeof subscription.verseDosage === 'number'
    ) && (
        !subscription.bookPool ||
        Array.isArray(subscription.bookPool) &&
        subscription.bookPool.length > 0 &&
        subscription.bookPool.reduce((acc, bookNumber) => acc && typeof bookNumber === 'number', true)
    ) && (
        !subscription.currentIssue ||
        issueFormatIsValid(subscription.currentIssue)
    );

const issueFormatIsValid = (issue) =>
    !!issue &&
    typeof issue.currentBook === 'number' &&
    typeof issue.currentChapter === 'number' &&
    typeof issue.currentVerse === 'number';

module.exports = {
    SECRET,
    checkResultsAndRespond,
    sign,
    authenticate,
    subscriptionFormatIsValid,
    issueFormatIsValid
};