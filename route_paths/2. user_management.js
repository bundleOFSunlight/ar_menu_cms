module.exports = (app, verifyToken) => {
    app.use(`/user_management/admin`, verifyToken, require(`../routes/2. user/2.1.0 user_management`));
};
