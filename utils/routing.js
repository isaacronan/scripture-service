const passport = require('passport');
const jwt = require('jsonwebtoken');
const yup = require('yup');

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

const updateSubscriptionSchema = yup.object().noUnknown().shape({
    name: yup.string().min(1),
    verseDosage: yup.number().integer().positive(),
    bookPool: yup.array().of(yup.number().integer().positive()).min(1),
    currentIssue: yup.object().noUnknown().shape({
        currentBook: yup.number().integer().positive().required(),
        currentChapter: yup.number().integer().positive().required(),
        currentVerse: yup.number().integer().positive().required()
    }).default(undefined)
});

const createSubscriptionSchema = yup.object().noUnknown().shape({
    name: yup.string().min(1).required(),
    verseDosage: yup.number().integer().positive().required(),
    bookPool: yup.array().of(yup.number().integer().positive()).min(1).required()
});

const credentialsSchema = yup.object().noUnknown().shape({
    username: yup.string().min(1).required(),
    password: yup.string().min(1).required(),
});

module.exports = {
    SECRET,
    checkResultsAndRespond,
    sign,
    authenticate,
    updateSubscriptionSchema,
    createSubscriptionSchema,
    credentialsSchema
};