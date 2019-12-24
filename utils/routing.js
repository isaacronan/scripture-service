const jwt = require('express-jwt');

const checkResultsAndRespond = (res) => (results) => {
    if (results.length) {
        res.json(results);
    } else {
        res.status(404).send({ error: 'No results found!' });
    }
};

const authenticate = jwt({ secret: 'secret2' });

module.exports = {
    checkResultsAndRespond,
    authenticate
};