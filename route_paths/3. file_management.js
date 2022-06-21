module.exports = (app, verifyToken) => {
    app.use(`/file_management/upload`, require(`../routes/3. file_upload/3.1.0 upload`));
    app.use(`/file_management/project`, verifyToken, require(`../routes/3. file_upload/3.2.0 file_group_mgmt`));
    app.use(`/file_management/public`, require(`../routes/3. file_upload/3.3.0 public_file`));
};
