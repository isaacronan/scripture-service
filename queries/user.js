const uuid = require('uuid');
const { getCollection, dbService } = require('../utils/db');

const users = getCollection('users');
const tokens = getCollection('tokens');

const EXP_TIME_MS = 1 * 60 * 1000;

const getUserAuthInfo = (username) => new Promise(async (resolve, reject) => {
    dbService.getCollection('users').then((users) => {
        if (users) {
            users.findOne({ username }, { projection: { _id: 0 }}).then((doc) => {
                resolve(doc);
            });
        } else {
            reject(null);
        }
    });
});

const createUserAccount = (username, password) => new Promise(async (resolve) => {
    (await users).insertOne({ username, password }).then(() => {
        resolve();
    });
});

const createRefreshToken = (username) => new Promise(async (resolve) => {
    const refresh = uuid.v4();
    (await tokens).insertOne({ username, refresh, timestamp: Date.now() }).then(() => {
        resolve(refresh);
    });
});

const getRefreshToken = (username, refresh) => new Promise(async (resolve) => {
    (await tokens).findOne({ username, refresh, timestamp: { $gt: Date.now() - EXP_TIME_MS } }).then((doc) => {
        resolve(doc);
    });
});

const deleteRefreshTokens = (username) => new Promise(async (resolve) => {
    (await tokens).deleteMany({ username }).then(() => {
        resolve();
    });
});

const updatePassword = (username, currentPassword, newPassword) => new Promise(async (resolve) => {
    (await users).updateOne({ username, password: currentPassword }, { $set: { password: newPassword }}).then(({ result }) => {
        resolve(result.n);
    });
});

const deleteUser = (username, password) => new Promise(async (resolve) => {
    (await users).deleteMany({ username, password }).then(({ result }) => {
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