const uuid = require('uuid');
const { dbService: { getCollection }} = require('../utils/db');;

const EXP_TIME_MS = 1 * 60 * 1000;

const getUserAuthInfo = (username) => getCollection('users').then((users) => {
    return users.findOne({ username }, { projection: { _id: 0 }}).then((doc) => {
        return doc;
    });
});

const createUserAccount = (username, password, salt) => getCollection('users').then((users) => {
    return users.insertOne({ username, password, salt }).then(({ result }) => {
        return result.n;
    });
});

const createRefreshToken = (username) => getCollection('tokens').then((tokens) => {
    const refresh = uuid.v4();
    return tokens.insertOne({ username, refresh, timestamp: Date.now() }).then(() => {
        return refresh;
    });
});

const getRefreshToken = (username, refresh) => getCollection('tokens').then((tokens) => {
    return tokens.findOne({ username, refresh, timestamp: { $gt: Date.now() - EXP_TIME_MS } }).then((doc) => {
        return doc;
    });
});

const deleteRefreshTokens = (username) => getCollection('tokens').then((tokens) => {
    return tokens.deleteMany({ username }).then(({ result }) => {
        return result.n;
    });
});

const updatePassword = (username, currentPassword, newPassword) => getCollection('users').then((users) => {
    return users.updateOne({ username, password: currentPassword }, { $set: { password: newPassword }}).then(({ result }) => {
        return result.n;
    });
});

const deleteUser = (username, password) => getCollection('users').then((users) => {
    return users.deleteMany({ username, password }).then(({ result }) => {
        return result.n;
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