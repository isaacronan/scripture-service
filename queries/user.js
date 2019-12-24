const { getCollection } = require('../utils/db');

const users = getCollection('users');

const getUserAuthInfo = (username) => new Promise(async (resolve) => {
    (await users).find({ username }, { projection: { _id: 0, password: 1 }}).toArray((_err, docs) => {
        resolve(docs);
    });
});

const createUserAccount = (username, password) => new Promise(async (resolve) => {
    (await users).find({ username }).toArray(async (_err, docs) => {
        if (docs.length) {
            resolve(true);
        } else {
            (await users).insertOne({ username, password }).then((result) => {
                resolve(false);
            });
        }
    });
});

module.exports = {
    getUserAuthInfo,
    createUserAccount
};