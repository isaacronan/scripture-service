const { dbService: { getCollection }, orderFavorite, orderFavorites } = require('../utils/db');;

const REFRESH_EXP_TIME = 1000 * 60 * 60 * 24 * 7;

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
    return tokens.findOne({ username, refresh, timestamp: { $gte: Date.now() - REFRESH_EXP_TIME }}).then((doc) => {
        return doc;
    });
});

const deleteAllRefreshTokens = (username) => getCollection('tokens').then((tokens) => {
    return tokens.deleteMany({ username }).then(({ result }) => {
        return result.n;
    });
});

const deleteExpiredRefreshTokens = (username, ...refreshTokens) => getCollection('tokens').then((tokens) => {
    return tokens.deleteMany({ username, $or: [{ timestamp: { $lt: Date.now() - REFRESH_EXP_TIME }}, { refresh: { $in: refreshTokens }}]}).then(({ result }) => {
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
    deleteAllRefreshTokens,
    deleteExpiredRefreshTokens,
    updatePassword,
    deleteUser,
    addFavorite,
    updateFavorites,
    REFRESH_EXP_TIME
};