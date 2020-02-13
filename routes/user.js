const express = require('express');
const uuid = require('uuid');
const router = express.Router();

const { getUserAuthInfo, createUserAccount, createRefreshToken, getRefreshToken, deleteRefreshTokens } = require('../queries/user');
const { sign, authenticate, credentialsSchema } = require('../utils/routing');

router.use(express.json());

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    getUserAuthInfo(username).then(async (docs) => {
        if (docs.length && docs[0].password === password) {
            const token = sign({ username });
            const refresh = await createRefreshToken(username);
            res.json({ message: 'Successful login!', token, refresh });
        } else {
            res.status(400).json({ error: 'Credentials don\'t match!' })
        }
    });
});

router.get('/logout', authenticate, async (req, res) => {
    deleteRefreshTokens(req.user.username);
    res.json({ message: 'User is deauthenticated.' });
});

router.post('/refresh', async (req, res) => {
    const { username, refresh } = req.body;
    const refreshIsValid = await getRefreshToken(username, refresh);
    if (refreshIsValid) {
        const token = sign({ username });
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