const qp = require('@flexsolver/flexqp2');

module.exports = {
    errorLog: async function (message, req) {
        const dao = {
            body: req.body || {},
            params: req.params || {},
            query: req.query || {},
        };

        if (req.url.toUpperCase().includes(`LOGIN`)) {
            dao.body = '{}';
        }

        const error_dao = {
            error_message: message,
            api_path: req.url,
            json_body: JSON.stringify(dao),
            error_type: req.method,
        };

        let error_id = `No insert ID..`;
        const result = await qp.run(`insert into error_log set ?`, [error_dao]);
        if (result) {
            error_id = result.insertId;
        }

        if (message.toUpperCase().includes(`JWT`) || req.url.toUpperCase().includes(`LOGIN`) || req.url === `/`) {
            return;
        }

        const msg = `<b>Error Detected!</b>\n\n<b>API URL: </b> ${error_dao.api_path}\n<b>Error ID:</b> ${error_id}\n<b>Message: </b> ${error_dao.error_message}\n`;
        // telegram.botAlert(msg);
    },
};
