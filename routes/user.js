const express = require('express');
const router = express.Router();

const { getUserAuthInfo, createUserAccount, createRefreshToken, getRefreshToken, deleteRefreshTokens, updatePassword, deleteUser } = require('../queries/user');
const { sign, authenticate, credentialsSchema, passwordSchema } = require('../utils/routing');

router.use(express.json());

router.post('/login', (req, res, next) => {
    const { username, password } = req.body;

    getUserAuthInfo(username).then(async (doc) => {
        if (doc && doc.password === password) {
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
        getUserAuthInfo(username).then((existingUser) => {
            if (existingUser) {
                res.status(400).json({ message: 'Account already exists.' });
            } else {
                createUserAccount(username, password).then(() => {
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
        const { currentPassword, newPassword } = passwordSchema.cast(passwords);
        updatePassword(req.user.username, currentPassword, newPassword).then((numUpdated) => {
            if (!numUpdated) {
                res.status(400).json({ message: 'Credentials don\'t match.' });
            } else {
                res.json({ message: 'Password successfully updated.' });
            }
        }).catch(next);
    }
});

router.post('/delete', authenticate, (req, res, next) => {
    const { password } = req.body;

    deleteRefreshTokens(req.user.username).then(async () => {
        const numDeleted = await deleteUser(req.user.username, password)
        if (numDeleted) {
            res.json({ message: 'User successfully deleted.' });
        } else {
            res.status(400).json({ message: 'Credentials don\'t match.' });
        }
    }).catch(next);
});

module.exports = router;