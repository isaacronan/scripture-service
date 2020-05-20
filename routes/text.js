const express = require('express');
const router = express.Router();

const { getBooks, getBook, getChapters, getChapter, createFeedback } = require('../queries/text');
const { checkResultsAndRespond, feedbackReportSchema } = require('../utils/routing');

router.use(express.json());

router.get('/', (_req, res, next) => {
    getBooks().then(checkResultsAndRespond(res, 'Could not retrieve books.')).catch(next);
});

router.get('/:booknumber', ({ params: { booknumber }}, res, next) => {
    getBook(Number(booknumber)).then(checkResultsAndRespond(res, 'Invalid book!')).catch(next);
});

router.get('/:booknumber/chapters', ({ params: { booknumber }, query }, res, next) => {
    getChapters(Number(booknumber), !!query.numberOnly).then(checkResultsAndRespond(res, 'Invalid book!')).catch(next);
});

router.get('/:booknumber/chapters/:chapternumber', ({ params: { booknumber, chapternumber }, query }, res, next) => {
    const { start, end } = query;
    getChapter(Number(booknumber), Number(chapternumber), Number(start), Number(end), !!query.numberOnly).then(checkResultsAndRespond(res, 'Invalid book or chapter!')).catch(next);
});

router.post('/feedback', async (req, res, next) => {
    const feedbackReport = req.body;

    const validatedFeedbackReport = await feedbackReportSchema.validate(feedbackReport).catch(() => null);

    if (!validatedFeedbackReport) {
        res.status(400).json({ error: 'Request format is invalid.' });
    } else {
        createFeedback(validatedFeedbackReport).then((numAdded) => {
            if (numAdded) {
                res.json({ message: 'Report successfully submitted.' });
            } else {
                res.status(400).json({ error: 'Report not submitted.' });
            }
        }).catch(next);
    }
});

module.exports = router;