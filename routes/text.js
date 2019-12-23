const express = require('express');
const router = express.Router();

const { getBooks, getBook, getChapters, getChapter } = require('../queries/text');
const { checkResultsAndRespond } = require('../utils/routing');

router.get('/', (_req, res) => {
    getBooks().then(checkResultsAndRespond(res));
});

router.get('/:booknumber', ({ params: { booknumber }}, res) => {
    getBook(Number(booknumber)).then(checkResultsAndRespond(res));
});

router.get('/:booknumber/chapters', ({ params: { booknumber }}, res) => {
    getChapters(Number(booknumber)).then(checkResultsAndRespond(res));
});

router.get('/:booknumber/chapters/:chapternumber', ({ params: { booknumber, chapternumber }}, res) => {
    getChapter(Number(booknumber), Number(chapternumber)).then(checkResultsAndRespond(res));
});

router.get('*', (_req, res) => {
    res.status(404).send({ error: 'Route not found!'});
});

module.exports = router;