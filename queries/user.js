const uuid = require('uuid');
const { getCollection } = require('../utils/db');

const users = getCollection('users');
const tokens = getCollection('tokens');

const EXP_TIME_MS = 1 * 60 * 1000;

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
            (await users).insertOne({ username, password }).then(() => {
                resolve(false);
            });
        }
    });
});

const createRefreshToken = (username) => new Promise(async (resolve) => {
    const refresh = uuid.v4();
    await deleteRefreshTokens(username);
    (await tokens).insertOne({ username, refresh, timestamp: Date.now() }).then(() => {
        resolve(refresh);
    });
});

const getRefreshToken = (username, refresh) => new Promise(async (resolve) => {
    (await tokens).find({ username, refresh, timestamp: { $gt: Date.now() - EXP_TIME_MS } }).toArray(async (_err, docs) => {
        if (docs.length) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
});

const deleteRefreshTokens = (username) => new Promise(async (resolve) => {
    (await tokens).remove({ username }).then(({ result }) => {
        resolve(result.n);
    });
});

const updatePassword = (username, currentPassword, newPassword) => new Promise(async (resolve) => {
    (await users).updateOne({ username, password: currentPassword }, { $set: { password: newPassword }}).then(({ result }) => {
        resolve(result.n);
    });
});

const deleteUser = (username, password) => new Promise(async (resolve) => {
    (await users).remove({ username, password }).then(({ result }) => {
        resolve(result.n);
    });
});

module.exports = {
    getUserAuthInfo,
    createUserAccount,
    createRefreshToken,
    getRefreshToken,
    deleteRefreshTokens,
    updatePassword,
    deleteUser
};