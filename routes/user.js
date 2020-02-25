const express = require('express');
const router = express.Router();

const { getUserAuthInfo, createUserAccount, createRefreshToken, getRefreshToken, deleteRefreshTokens, updatePassword, deleteUser, addFavorite, getFavorites, updateFavorites } = require('../queries/user');
const { deleteSubscriptions } = require('../queries/subscriptions');
const { sign, authenticate, credentialsSchema, passwordSchema, generateSalt, hashPassword, favoriteSchema, favoritesSchema } = require('../utils/routing');

router.use(express.json());

router.post('/login', (req, res, next) => {
    const { username, password } = req.body;

    getUserAuthInfo(username).then(async (doc) => {
        if (doc && doc.password === hashPassword(password, doc.salt)) {
            const token = sign({ username });
            await deleteRefreshTokens(username);
            const refresh = await createRefreshToken(username);
            res.json({ message: 'Successful login!', token, refresh });
        } else {
            res.status(400).json({ error: 'Credentials don\'t match!' })
        }
    }).catch(next);
});

router.get('/logout', authenticate, (req, res, next) => {
    deleteRefreshTokens(req.user.username).then(() => {
        res.json({ message: 'User is deauthenticated.' });
    }).catch(next);
});

router.post('/refresh', (req, res, next) => {
    const { username, refresh } = req.body;
    getRefreshToken(username, refresh).then(async (refreshToken) => {
        if (refreshToken) {
            const token = sign({ username });
            await deleteRefreshTokens(username);
            const refresh = await createRefreshToken(username);
            res.json({ message: 'New token successfully obtained.', token, refresh });
        } else {
            res.status(400).send({ error: 'Refresh token is invalid.' });
        }
    }).catch(next);
});

router.post('/create', async (req, res, next) => {
    const credentials = req.body;

    const isValid = await credentialsSchema.isValid(credentials);

    if (!isValid) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        const { username, password } = credentialsSchema.cast(credentials);
        getUserAuthInfo(username).then(async (existingUser) => {
            if (existingUser) {
                res.status(400).json({ error: 'Account already exists.' });
            } else {
                const salt = await generateSalt();
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
            await deleteRefreshTokens(req.user.username);
            await deleteSubscriptions(req.user.username);
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
        addFavorite(req.user.username, validatedFavorite).then(async (numUpdated) => {
            if (numUpdated) {
                res.json({ message: 'Favorite successfully added.' });
            } else {
                res.status(400).json({ error: 'Favorite not added.' });
            }
        }).catch(next);
    }
});

router.get('/favorites', authenticate, async (req, res, next) => {
    getFavorites(req.user.username).then((doc) => {
        res.json(doc.favorites);
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
                res.json({ message: 'Favorites successfully updated.', favorites: validatedFavorites });
            }
        }).catch(next);
    }
});

module.exports = router;