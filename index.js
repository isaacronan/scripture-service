const express = require('express');
const { Strategy, ExtractJwt } = require('passport-jwt');
const passport = require('passport');

const { SECRET } = require('./utils/routing');

const app = express();
const PORT = 1582;

const books = require('./routes/text');
const subscriptions = require('./routes/subscriptions');
const user = require('./routes/user');

app.use(passport.initialize());
app.use('/books', books);
app.use('/subscriptions', subscriptions);
app.use('/user', user);

passport.use(new Strategy({ secretOrKey: SECRET, jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() }, ({ username }, done) => {
    done(null, { username });
}));

app.listen(PORT, () => console.log(`listening on port ${PORT}...`));
