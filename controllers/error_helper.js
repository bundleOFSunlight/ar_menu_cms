let qp = require("@flexsolver/flexqp2");

module.exports = {
	errorLog: async function (message, req) {
		let dao = {
			body: req.body || {},
			params: req.params || {},
			query: req.query || {}
		};

		if (req.url.toUpperCase().includes(`LOGIN`)) {
			dao.body = '{}';
		}

		let error_dao = {
			error_message: message,
			api_path: req.url,
			json_body: JSON.stringify(dao),
			error_type: req.method
		};

		let error_id = `No insert ID..`;
		let result = await qp.run(`insert into error_log set ?`, [error_dao]);
		if (result) {
			error_id = result.insertId;
		}

		if (message.toUpperCase().includes(`JWT`) || req.url.toUpperCase().includes(`LOGIN`) || req.url === `/`) {
			return;
		}

		let msg = `<b>Error Detected!</b>\n\n<b>API URL: </b> ${error_dao.api_path}\n<b>Error ID:</b> ${error_id}\n<b>Message: </b> ${error_dao.error_message}\n`;
		// telegram.botAlert(msg);
	},
};
