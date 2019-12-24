const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { getUserAuthInfo } = require('../queries/user');

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

module.exports = router;