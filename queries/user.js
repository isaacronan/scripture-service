const { getCollection } = require('../utils/db');

const users = getCollection('users');

const getUserAuthInfo = (username) => new Promise(async (resolve) => {
    (await users).find({ username }, { projection: { _id: 0, password: 1 }}).toArray((_err, docs) => {
        resolve(docs);
    });
});

module.exports = {
    getUserAuthInfo
};