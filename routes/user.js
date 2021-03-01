const express = require('express');
const router = express.Router();

const { getUserAuthInfo, createUserAccount, createRefreshToken, getRefreshToken, deleteAllRefreshTokens, deleteExpiredRefreshTokens, updatePassword, deleteUser, addFavorite, getFavorites, updateFavorites, REFRESH_EXP_TIME } = require('../queries/user');
const { deleteSubscriptions } = require('../queries/subscriptions');
const { sign, authenticate, credentialsSchema, passwordSchema, generateRandom, hashPassword, favoriteSchema, favoritesSchema, setRefreshCookies, unsetRefreshCookies, refreshMiddleware } = require('../utils/routing');
const { getSelectedText } = require('../queries/text');

router.use(express.json());

router.post('/login', (req, res, next) => {
    const { username: mixedCase, password } = req.body;
    const username = mixedCase.toLowerCase();

    getUserAuthInfo(username).then(async (doc) => {
        if (doc && doc.password === hashPassword(password, doc.salt)) {
            const token = sign({ username });
            const refresh = await generateRandom();
            await deleteExpiredRefreshTokens(username);
            await createRefreshToken(username, refresh);
            setRefreshCookies(res, username, refresh);
            res.json({ message: 'Successful login!', token });
        } else {
            res.status(400).json({ error: 'Credentials don\'t match!' })
        }
    }).catch(next);
});

router.get('/logout', authenticate, (req, res, next) => {
    const { refresh = null } = req.cookies;
    deleteExpiredRefreshTokens(req.user.username, refresh).then(() => {
        unsetRefreshCookies(res);
        res.json({ message: 'User is deauthenticated.' });
    }).catch(next);
});

router.get('/refresh', refreshMiddleware, (_, res) => {
    const { token, message } = res.locals.refresh;
    if (token) {
        res.json({ message, token });
    } else {
        res.status(400).send({ error: message });
    }
});

router.post('/create', async (req, res, next) => {
    const credentials = req.body;

    const isValid = await credentialsSchema.isValid(credentials);

    if (!isValid) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        const { username: mixedCase, password } = credentialsSchema.cast(credentials);
        const username = mixedCase.toLowerCase();
        getUserAuthInfo(username).then(async (existingUser) => {
            if (existingUser) {
                res.status(400).json({ error: 'Account already exists.' });
            } else {
                const salt = await generateRandom();
                const hashedPassword = hashPassword(password, salt);
                createUserAccount(username, hashedPassword, salt).then(() => {
                    res.json({ message: 'Account created.' });
                });
            }
        }).catch(next);
    }
});

router.put('/password', authenticate, async (req, res, next) => {
    const passwords = req.body;

    const isValid = await passwordSchema.isValid(passwords);

    if (!isValid) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        const { salt } = await getUserAuthInfo(req.user.username);
        const { currentPassword, newPassword } = passwordSchema.cast(passwords);
        updatePassword(req.user.username, hashPassword(currentPassword, salt), hashPassword(newPassword, salt)).then((numUpdated) => {
            if (!numUpdated) {
                res.status(400).json({ error: 'Credentials don\'t match.' });
            } else {
                res.json({ message: 'Password successfully updated.' });
            }
        }).catch(next);
    }
});

router.post('/delete', authenticate, async (req, res, next) => {
    const { password } = req.body;
    const { salt } = await getUserAuthInfo(req.user.username);

    deleteUser(req.user.username, hashPassword(password, salt)).then(async (numDeleted) => {
        if (numDeleted) {
            await deleteAllRefreshTokens(req.user.username);
            await deleteSubscriptions(req.user.username);
            unsetRefreshCookies(res);
            res.json({ message: 'User successfully deleted.' });
        } else {
            res.status(400).json({ error: 'Credentials don\'t match.' });
        }
    }).catch(next);
});

router.post('/favorites', authenticate, async (req, res, next) => {
    const favorite = req.body;

    const validatedFavorite = await favoriteSchema.validate(favorite).catch(() => null);

    if (!validatedFavorite) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        addFavorite(req.user.username, validatedFavorite).then((numUpdated) => {
            if (numUpdated) {
                res.json({ message: 'Favorite successfully added.' });
            } else {
                res.status(400).json({ error: 'Favorite not added.' });
            }
        }).catch(next);
    }
});

router.get('/favorites', authenticate, (req, res, next) => {
    getFavorites(req.user.username).then(async (doc) => {
        const { favorites: favoritesRanges } = doc;
        const selectedText = await getSelectedText(favoritesRanges);
        const favorites = favoritesRanges.map((favoritesRange) => ({
            ...favoritesRange,
            verses: selectedText
                .find(({ booknumber }) => booknumber === favoritesRange.booknumber).chapters
                .find(({ chapternumber }) => chapternumber === favoritesRange.chapternumber).verses
                .filter(({ versenumber }) => versenumber >= favoritesRange.start && versenumber <= favoritesRange.end)
        }));
        res.json(favorites);
    }).catch(next);
});

router.put('/favorites', authenticate, async (req, res, next) => {
    const favorites = req.body;

    const validatedFavorites = await favoritesSchema(req.user.username).validate(favorites).catch(() => null);

    if (!validatedFavorites) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        updateFavorites(req.user.username, validatedFavorites).then((numUpdated) => {
            if (!numUpdated) {
                res.status(400).json({ error: 'Favorites not updated.' });
            } else {
                res.json({ message: 'Favorites successfully updated.' });
            }
        }).catch(next);
    }
});

module.exports = router;