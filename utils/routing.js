const crypto = require('crypto');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const yup = require('yup');

const { getVerse } = require('../queries/text');

const SECRET = process.env.SECRET;

const LASTBOOK = 73;

const checkResultsAndRespond = (res) => (results) => {
    if (results.length) {
        res.json(results);
    } else {
        res.status(404).send({ error: 'No results found!' });
    }
};

const sign = payload => jwt.sign(payload, SECRET, { expiresIn: 30 * 60 });

const authenticate = passport.authenticate('jwt', { session: false });

const issueValidator = async (issue) => !issue || await getVerse(
    issue.currentBook,
    issue.currentChapter,
    issue.currentVerse
);

const updateSubscriptionSchema = yup.object().noUnknown().shape({
    name: yup.string().min(1),
    verseDosage: yup.number().integer().positive(),
    bookPool: yup.array().of(yup.number().integer().positive().lessThan(LASTBOOK + 1)).min(1),
    currentIssue: yup.object().noUnknown().shape({
        currentBook: yup.number().integer().positive().required(),
        currentChapter: yup.number().integer().positive().required(),
        currentVerse: yup.number().integer().positive().required()
    }).default(undefined).test('', '', issueValidator)
});

const createSubscriptionSchema = yup.object().noUnknown().shape({
    name: yup.string().min(1).required(),
    verseDosage: yup.number().integer().positive().required(),
    bookPool: yup.array().of(yup.number().integer().positive().lessThan(LASTBOOK + 1)).min(1).required()
});

const credentialsSchema = yup.object().noUnknown().shape({
    username: yup.string().min(1).required(),
    password: yup.string().min(1).required(),
});

const passwordSchema = yup.object().noUnknown().shape({
    currentPassword: yup.string().min(1).required(),
    newPassword: yup.string().min(1).required(),
});

const generateSalt = () => new Promise((resolve) => {
    crypto.randomBytes(8, (_err, buf) => {
        resolve(buf.toString('hex'));
    });
});

const hashPassword = (password, salt) => {
    const hash = crypto.createHash('sha256');
    hash.update(`${password}${salt}`);
    return hash.digest().toString('hex');
};

module.exports = {
    SECRET,
    checkResultsAndRespond,
    sign,
    authenticate,
    updateSubscriptionSchema,
    createSubscriptionSchema,
    credentialsSchema,
    passwordSchema,
    generateSalt,
    hashPassword
};