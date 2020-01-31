const express = require('express');
const router = express.Router();

const { getUserAuthInfo, createUserAccount } = require('../queries/user');
const { sign, authenticate } = require('../utils/routing');

router.use(express.json());

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    getUserAuthInfo(username).then((docs) => {
        if (docs.length && docs[0].password === password) {
            const token = sign({ username });
            res.json({ message: 'Successful login!', token });
        } else {
            res.status(400).json({ error: 'Credentials don\'t match!' })
        }
    });
});

router.post('/create', (req, res) => {
    const { username, password } = req.body;

    createUserAccount(username, password).then((alreadyExists) => {
        if (alreadyExists) {
            res.status(400).json({ message: 'Account already exists.' });
        } else {
            res.json({ message: 'Account created.' });
        }
    });
});

router.get('/secret', authenticate, (req, res) => {
    res.send(req.user.username);
});

module.exports = router;