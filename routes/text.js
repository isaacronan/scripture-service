const express = require('express');
const router = express.Router();

const { getBooks, getBook, getChapters, getChapter } = require('../queries/text');
const { checkResultsAndRespond } = require('../utils/routing');

router.get('/', (_req, res, next) => {
    getBooks().then(checkResultsAndRespond(res)).catch(next);
});

router.get('/:booknumber', ({ params: { booknumber }}, res, next) => {
    getBook(Number(booknumber)).then(checkResultsAndRespond(res)).catch(next);
});

router.get('/:booknumber/chapters', ({ params: { booknumber }}, res, next) => {
    getChapters(Number(booknumber)).then(checkResultsAndRespond(res)).catch(next);
});

router.get('/:booknumber/chapters/:chapternumber', ({ params: { booknumber, chapternumber }}, res, next) => {
    getChapter(Number(booknumber), Number(chapternumber)).then(checkResultsAndRespond(res)).catch(next);
});

module.exports = router;