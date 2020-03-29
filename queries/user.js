const { dbService: { getCollection }, orderFavorite, orderFavorites } = require('../utils/db');;

const EXP_TIME_MS = 1000 * 60 * 60 * 36;

const getUserAuthInfo = (username) => getCollection('users').then((users) => {
    return users.findOne({ username }, { projection: { _id: 0 }}).then((doc) => {
        return doc;
    });
});

const createUserAccount = (username, password, salt) => getCollection('users').then((users) => {
    return users.insertOne({ username, password, salt, favorites: [] }).then(({ result }) => {
        return result.n;
    });
});

const createRefreshToken = (username, refresh) => getCollection('tokens').then((tokens) => {
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

const getFavorites = (username) => getCollection('users').then((users) => {
    return users.findOne({ username }, { projection: { _id: 0, favorites: 1 }}).then((doc) => {
        return doc;
    });
});

const addFavorite = (username, favorite) => getCollection('users').then((users) => {
    return users.updateOne({ username }, { $addToSet: { favorites: orderFavorite(favorite) }}).then(({ result }) => {
        return result.n;
    });
});

const updateFavorites = (username, favorites) => getCollection('users').then((users) => {
    return users.updateOne({ username }, { $set: { favorites: orderFavorites(favorites) }}).then(({ result }) => {
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
    deleteUser,
    addFavorite,
    getFavorites,
    updateFavorites
};