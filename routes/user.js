const express = require('express');
const uuid = require('uuid');
const router = express.Router();

const { getUserAuthInfo, createUserAccount } = require('../queries/user');
const { sign, authenticate, credentialsSchema } = require('../utils/routing');

let refreshTokens = [];
const EXP_TIME_MS = 1 * 60 * 1000;

const clearUserRefreshTokens = username => refreshTokens = refreshTokens.filter(refreshToken => refreshToken.username !== username);

router.use(express.json());

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    getUserAuthInfo(username).then((docs) => {
        if (docs.length && docs[0].password === password) {
            const token = sign({ username });
            const refresh = uuid.v4();
            clearUserRefreshTokens(username);
            refreshTokens.push({ username, refresh, timestamp: Date.now() });
            res.json({ message: 'Successful login!', token, refresh });
        } else {
            res.status(400).json({ error: 'Credentials don\'t match!' })
        }
    });
});

router.get('/logout', authenticate, (req, res) => {
    clearUserRefreshTokens(req.user.username);
    res.json({ message: 'User is deauthenticated.' });
});

router.post('/refresh', (req, res) => {
    const { username, refresh } = req.body;
    const refreshTokenIndex = refreshTokens.findIndex(refreshToken => refreshToken.refresh === refresh && refreshToken.username == username)
    if (refreshTokenIndex !== -1 && Date.now() - refreshTokens[refreshTokenIndex].timestamp < EXP_TIME_MS) {
        const token = sign({ username });
        const refresh = uuid.v4();
        clearUserRefreshTokens(username);
        refreshTokens.push({ username, refresh });
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
        createUserAccount(username, password).then((alreadyExists) => {
            if (alreadyExists) {
                res.status(400).json({ message: 'Account already exists.' });
            } else {
                res.json({ message: 'Account created.' });
            }
        });
    }
});

module.exports = router;