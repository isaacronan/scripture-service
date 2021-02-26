const crypto = require('crypto');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const yup = require('yup');

const { getVerse } = require('../queries/text');
const { getFavorites, REFRESH_EXP_TIME, getRefreshToken, deleteExpiredRefreshTokens, createRefreshToken } = require('../queries/user');
const { getSubscription } = require('../queries/subscriptions');

const SECRET = process.env.SECRET || 'secret';
const JWT_EXP_TIME = 60 * 15;
const TOKEN_DNE = '';
const BASE_PATH = '/scripture';

const LASTBOOK = 73;
const feedbackReportTypes = ['TYPO', 'NMBR'];

const subscriptionNamePattern = /\S+/;
const usernamePattern = /^\w+$/;
const passwordPattern = /^\S+$/;

const checkResultsAndRespond = (res, errorMessage = '') => (results) => {
    const isEmptyArray = Array.isArray(results) && !results.length;
    if (!isEmptyArray && results !== null) {
        res.json(results);
    } else {
        res.status(404).send({ error: errorMessage });
    }
};

const setRefreshCookies = (res, username, refresh) => {
    const cookieExpiry = new Date(Date.now() + REFRESH_EXP_TIME);
    res.cookie('username', username, { path: BASE_PATH, httpOnly: true, expires: cookieExpiry });
    res.cookie('refresh', refresh, { path: BASE_PATH, httpOnly: true, expires: cookieExpiry });
};

const unsetRefreshCookies = (res) => {
    res.cookie('username', '', { path: BASE_PATH, httpOnly: true, expires: new Date(0) });
    res.cookie('refresh', '', { path: BASE_PATH, httpOnly: true, expires: new Date(0) });
};

const sign = payload => jwt.sign(payload, SECRET, { expiresIn: JWT_EXP_TIME });

const authenticate = passport.authenticate('jwt', { session: false });

const issueValidator = async (issue) => !issue || await getVerse(
    issue.currentBook,
    issue.currentChapter,
    issue.currentVerse
);

const favoriteValidator = async (favorite) => (favorite.end >= favorite.start) && await getVerse(
    favorite.booknumber,
    favorite.chapternumber,
    favorite.start
) && (favorite.end === favorite.start || await getVerse(
    favorite.booknumber,
    favorite.chapternumber,
    favorite.end
));

const constructFavoriteComparator = (favoriteA) => (favoriteB) => (
    favoriteA.booknumber === favoriteB.booknumber &&
    favoriteA.chapternumber === favoriteB.chapternumber &&
    favoriteA.start === favoriteB.start &&
    favoriteA.end === favoriteB.end
);

const favoritesExistenceValidator = (username) => async (favorites) => {
    const { favorites: existingFavorites } = await getFavorites(username);
    const favoriteIsNotExisting = favorite => existingFavorites.findIndex(constructFavoriteComparator(favorite)) === -1;

    return favorites.filter(favoriteIsNotExisting).length === 0;
};

const favoritesUniquenessValidator = (favorites) => {
    const favoriteToInstanceCount = favorite => favorites.filter(constructFavoriteComparator(favorite)).length;
    const instanceCounts = favorites.map(favoriteToInstanceCount);
    const duplicates = instanceCounts.filter(instanceCount => instanceCount > 1);
    return duplicates.length === 0;
};

const feedbackReportValidator = async (feedbackReport) => await getVerse(
    feedbackReport.booknumber,
    feedbackReport.chapternumber,
    feedbackReport.versenumber
);

const updateSubscriptionSchema = yup.object().noUnknown().shape({
    name: yup.string().matches(subscriptionNamePattern),
    verseDosage: yup.number().integer().positive(),
    isChapterSubscription: yup.boolean(),
    bookPool: yup.array().of(yup.number().integer().positive().lessThan(LASTBOOK + 1)).min(1),
    currentIssue: yup.object().noUnknown().shape({
        currentBook: yup.number().integer().positive().required(),
        currentChapter: yup.number().integer().positive().required(),
        currentVerse: yup.number().integer().positive().required()
    }).default(undefined).test('', '', issueValidator).nullable(true)
});

const createSubscriptionSchema = yup.object().noUnknown().shape({
    name: yup.string().matches(subscriptionNamePattern).required(),
    verseDosage: yup.number().integer().positive().required(),
    isChapterSubscription: yup.boolean().required(),
    bookPool: yup.array().of(yup.number().integer().positive().lessThan(LASTBOOK + 1)).min(1).required()
});

const credentialsSchema = yup.object().noUnknown().shape({
    username: yup.string().matches(usernamePattern).required(),
    password: yup.string().matches(passwordPattern).required(),
});

const passwordSchema = yup.object().noUnknown().shape({
    currentPassword: yup.string().matches(passwordPattern).required(),
    newPassword: yup.string().matches(passwordPattern).required(),
});

const favoriteSchema = yup.object().noUnknown().shape({
    booknumber: yup.number().integer().positive().lessThan(LASTBOOK + 1).required(),
    chapternumber: yup.number().integer().positive().required(),
    start: yup.number().integer().positive().required(),
    end: yup.number().integer().positive().required(),
}).test('', '', favoriteValidator);

const favoritesSchema = (username) => yup.array().of(yup.object().noUnknown().shape({
    booknumber: yup.number().integer().positive().lessThan(LASTBOOK + 1).required(),
    chapternumber: yup.number().integer().positive().required(),
    start: yup.number().integer().positive().required(),
    end: yup.number().integer().positive().required(),
})).test('', '', favoritesUniquenessValidator).test('', '', favoritesExistenceValidator(username));

const feedbackReportSchema = yup.object().noUnknown().shape({
    booknumber: yup.number().integer().positive().lessThan(LASTBOOK + 1).required(),
    chapternumber: yup.number().integer().positive().required(),
    versenumber: yup.number().integer().positive().required(),
    type: yup.string().oneOf(feedbackReportTypes).required()
}).test('', '', feedbackReportValidator);

const generateRandom = (size = 16) => new Promise((resolve) => {
    crypto.randomBytes(size, (_err, buf) => {
        resolve(buf.toString('hex'));
    });
});

const generateSubscriptionId = (username) => new Promise(async (resolve) => {
    let id = null, attempts = 5;
    do {
        id = await generateRandom(2);
    } while(await getSubscription(username, id) && --attempts);

    resolve(attempts ? id : null);
});

const hashPassword = (password, salt) => {
    const hash = crypto.createHash('sha256');
    hash.update(`${password}${salt}`);
    return hash.digest().toString('hex');
};

const refreshMiddleware = (req, res, next) => {
    if (req.cookies.username && req.cookies.refresh) {
        const { username: mixedCase, refresh: existingRefresh } = req.cookies;
        const username = mixedCase.toLowerCase();
        getRefreshToken(username, existingRefresh).then(async (refreshToken) => {
            if (refreshToken) {
                const token = sign({ username });
                const refresh = await generateRandom();
                await deleteExpiredRefreshTokens(username, existingRefresh);
                await createRefreshToken(username, refresh);
                setRefreshCookies(res, username, refresh);
                res.locals.refresh = { username, token: token, message: 'New token successfully obtained.' };
            } else {
                res.locals.refresh = { token: TOKEN_DNE, message: 'Refresh token is invalid.' };
                unsetRefreshCookies(res);
            }
            next();
        }).catch(next);
    } else {
        res.locals.refresh = { token: TOKEN_DNE, message: 'No refresh token found.' };
        unsetRefreshCookies(res);
        next();
    }
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
    generateRandom,
    hashPassword,
    favoriteSchema,
    favoritesSchema,
    feedbackReportSchema,
    setRefreshCookies,
    unsetRefreshCookies,
    BASE_PATH,
    refreshMiddleware,
    generateSubscriptionId
};