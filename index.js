require('dotenv').config();
const express = require('express');
const { Strategy, ExtractJwt } = require('passport-jwt');
const passport = require('passport');
const cookieParser = require('cookie-parser');

const { SECRET, BASE_PATH, refreshMiddleware, ssrMiddleware } = require('./utils/routing');

const app = express();
const PORT = process.env.PORT || 8001;

const books = require('./routes/text');
const subscriptions = require('./routes/subscriptions');
const user = require('./routes/user');

const apiRouter = express.Router();
const ssrRouter = express.Router();

app.use(cookieParser());
app.use(passport.initialize());
app.use(BASE_PATH, express.static('static'));
app.use(`${BASE_PATH}/api`, apiRouter);
app.use(BASE_PATH, ssrRouter);

apiRouter.use('/books', books);
apiRouter.use('/subscriptions', subscriptions);
apiRouter.use('/user', user);
apiRouter.use((_req, res) => {
    res.status(404).send({ error: 'Route not found.' });
});
apiRouter.use((_err, _req, res, _next) => {
    res.status(500).send({ error: 'Server error encountered.' });
});

ssrRouter.use(refreshMiddleware);

ssrRouter.get('/books/:booknumber', ssrMiddleware(['books', 'chapters']));
ssrRouter.get('/books/:booknumber/chapters/:chapternumber', ssrMiddleware(['books', 'chapters', 'verses']));
ssrRouter.get('/dashboard', ssrMiddleware(['books', 'subscriptions']));
ssrRouter.get('/subscription/edit/:id', ssrMiddleware(['books', 'subscriptions']));
ssrRouter.get('/subscription/:id', ssrMiddleware(['books', 'subscription']));
ssrRouter.use(ssrMiddleware(['books']));

passport.use(new Strategy({ secretOrKey: SECRET, jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() }, ({ username }, done) => {
    done(null, { username });
}));

app.listen(PORT, () => console.log(`listening on port ${PORT}...`));
