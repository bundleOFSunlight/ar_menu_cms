module.exports = (app, verifyToken) => {
    app.use(`/authentication/login`, require(`../routes/1. auth/1.1.0 login`));
    app.use(`/authentication/forgot_password`, require(`../routes/1. auth/1.2.0 forgot_password`));
    app.use(`/authentication/reset_password`, require(`../routes/1. auth/1.3.0 reset_email_pw`));
    app.use(`/authentication/change_password`, verifyToken, require(`../routes/1. auth/1.4.0 change_pw`));
};
