const express = require('express');
const router = express.Router();

const { getUserAuthInfo, createUserAccount, createRefreshToken, getRefreshToken, deleteRefreshTokens, updatePassword, deleteUser } = require('../queries/user');
const { sign, authenticate, credentialsSchema, passwordSchema } = require('../utils/routing');

router.use(express.json());

router.post('/login', (req, res) => {
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
    }).catch(() => {
        res.status(500).send({ error: 'Server error encountered.' });
    });
});

router.get('/logout', authenticate, async (req, res) => {
    deleteRefreshTokens(req.user.username);
    res.json({ message: 'User is deauthenticated.' });
});

router.post('/refresh', async (req, res) => {
    const { username, refresh } = req.body;
    const refreshToken = await getRefreshToken(username, refresh);
    if (refreshToken) {
        const token = sign({ username });
        await deleteRefreshTokens(username);
        const refresh = await createRefreshToken(username);
        res.json({ message: 'New token successfully obtained.', token, refresh });
    } else {
        res.status(400).send({ error: 'Refresh token is invalid.' });
    }
});

router.post('/create', async (req, res) => {
    const credentials = req.body;

    const isValid = await credentialsSchema.isValid(credentials);

    if (!isValid) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        const { username, password } = credentialsSchema.cast(credentials);
        const existingUser = await getUserAuthInfo(username);
        if (existingUser) {
            res.status(400).json({ message: 'Account already exists.' });
        } else {
            createUserAccount(username, password).then(() => {
                res.json({ message: 'Account created.' });
            });
        }     
    }
});

router.put('/password', authenticate, async (req, res) => {
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
        });
    }
});

router.post('/delete', authenticate, async (req, res) => {
    const { password } = req.body;

    await deleteRefreshTokens(req.user.username);
    deleteUser(req.user.username, password).then((numDeleted) => {
        if (numDeleted) {
            res.json({ message: 'User successfully deleted.' });
        } else {
            res.status(400).json({ message: 'Credentials don\'t match.' });
        }
    });
});

module.exports = router;