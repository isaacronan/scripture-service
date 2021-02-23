require('dotenv').config();
const fs = require('fs');
const express = require('express');
const { Strategy, ExtractJwt } = require('passport-jwt');
const passport = require('passport');

const { SECRET } = require('./utils/routing');

const { getBooks, getChapters, getChapter } = require('./queries/text');
const ssr = require('./scripture-ssr').default;

const app = express();
const PORT = process.env.PORT || 8001;

const books = require('./routes/text');
const subscriptions = require('./routes/subscriptions');
const user = require('./routes/user');

const apiRouter = express.Router();
const ssrRouter = express.Router();

app.use('/scripture', express.static('static'));
app.use('/scripture/api', apiRouter);
app.use('/scripture', ssrRouter);
app.use(passport.initialize());

apiRouter.use('/books', books);
apiRouter.use('/subscriptions', subscriptions);
apiRouter.use('/user', user);
apiRouter.use((_req, res) => {
    res.status(404).send({ error: 'Route not found.' });
});
apiRouter.use((_err, _req, res, _next) => {
    res.status(500).send({ error: 'Server error encountered.' });
});

ssrRouter.get('/books/:booknumber', async (req, res) => {
    const { booknumber } = req.params;
    const [books, chapters] = await Promise.all([getBooks(), getChapters(Number(booknumber))]);
    const prefetched = { books, chapters };
    const { head, html } = ssr.render({ prefetched });

    fs.readFile('./static/scripture.html', (_, content) => {
        const rendered = content.toString()
            .replace('</head>', `${head}</head>`)
            .replace('<body>', `<body>${html}<script>window.__PREFETCHED__=${JSON.stringify(prefetched)}</script>`)
        res.send(rendered);
    });
});

ssrRouter.get('/books/:booknumber/chapters/:chapternumber', async (req, res) => {
    const { booknumber, chapternumber } = req.params;
    const [books, chapters, verses] = await Promise.all([getBooks(), getChapters(Number(booknumber)), getChapter(Number(booknumber), Number(chapternumber))]);
    const prefetched = { books, chapters, verses };
    const { head, html } = ssr.render({ prefetched });

    fs.readFile('./static/scripture.html', (_, content) => {
        const rendered = content.toString()
            .replace('</head>', `${head}</head>`)
            .replace('<body>', `<body>${html}<script>window.__PREFETCHED__=${JSON.stringify(prefetched)}</script>`)
        res.send(rendered);
    });
});

ssrRouter.get(/\/\.*/, async (_, res) => {
    const books = await getBooks();
    const prefetched = { books };
    const { head, html } = ssr.render({ prefetched });

    fs.readFile('./static/scripture.html', (_, content) => {
        const rendered = content.toString()
            .replace('</head>', `${head}</head>`)
            .replace('<body>', `<body>${html}<script>window.__PREFETCHED__=${JSON.stringify(prefetched)}</script>`)
        res.send(rendered);
    });
});

passport.use(new Strategy({ secretOrKey: SECRET, jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() }, ({ username }, done) => {
    done(null, { username });
}));

app.listen(PORT, () => console.log(`listening on port ${PORT}...`));
