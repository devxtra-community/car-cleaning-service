"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPushToken = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
const updateUserPushToken = async (userId, token) => {
    await connectDatabase_1.pool.query('UPDATE users SET push_token = $1 WHERE id = $2', [token, userId]);
};
exports.updateUserPushToken = updateUserPushToken;
