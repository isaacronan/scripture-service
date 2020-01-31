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

const sign = payload => jwt.sign(payload, SECRET, { expiresIn: 30 });

const authenticate = passport.authenticate('jwt', { session: false });

module.exports = {
    SECRET,
    checkResultsAndRespond,
    sign,
    authenticate
};