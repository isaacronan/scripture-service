const express = require('express');
const app = express();
const PORT = 1582;

const books = require('./routes/text');
const subscriptions = require('./routes/subscriptions');

app.use('/books', books);
app.use('/subscriptions', subscriptions);

app.listen(PORT, () => console.log(`listening on port ${PORT}...`));
