const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { getUserAuthInfo, createUserAccount } = require('../queries/user');

router.use(express.json());

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    getUserAuthInfo(username).then((docs) => {
        if (docs.length && docs[0].password === password) {
            const token = jwt.sign({ username }, 'secret2');
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

module.exports = router;