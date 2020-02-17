require('dotenv').config();
const express = require('express');
const { Strategy, ExtractJwt } = require('passport-jwt');
const passport = require('passport');

const { SECRET } = require('./utils/routing');

const app = express();
const PORT = process.env.PORT;

const books = require('./routes/text');
const subscriptions = require('./routes/subscriptions');
const user = require('./routes/user');

app.use(passport.initialize());
app.use('/books', books);
app.use('/subscriptions', subscriptions);
app.use('/user', user);
app.use((_req, res) => {
    res.status(404).send({ error: 'Route not found.' });
});
app.use((_err, _req, res, _next) => {
    res.status(500).send({ error: 'Server error encountered.' });
});

passport.use(new Strategy({ secretOrKey: SECRET, jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() }, ({ username }, done) => {
    done(null, { username });
}));

app.listen(PORT, () => console.log(`listening on port ${PORT}...`));
