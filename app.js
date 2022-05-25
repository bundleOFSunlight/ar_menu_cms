const createError = require(`http-errors`);
const express = require(`express`);
const path = require(`path`);
const cookieParser = require(`cookie-parser`);
const bodyParser = require(`body-parser`);
const logger = require(`morgan`);
const moment = require(`moment`);
const jwt = require(`jsonwebtoken`);
// const JWT_SECRET = require(`./resources/global`).JWT_SECRET;
const rb = require(`@flexsolver/flexrb`);
const error_helper = require(`./controllers/helpers/error_helper`);
const app = express();

const cors = require(`cors`);
const qp = require(`@flexsolver/flexqp2`);

qp.presetConnection({
	limit: process.env.DB_LIMIT,
	host: process.env.DB_HOST,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
	database: process.env.DB_DATABASE,
});

const storage = require('node-persist');
logger.token(`date`, (req, res) => {
	return moment().format(`DD MMM YYYY HH:mm:ss`);
});


app.use(logger(`[:date] :method :url :status :res[content-length] - :response-time ms`));
app.use(bodyParser.json({ limit: `500mb` }));
app.use(bodyParser.urlencoded({ limit: `500mb`, extended: true, parameterLimit: 50000 }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, `public`)));
app.use(cors({ exposedHeaders: 'Content-Disposition' }));
rb.setQpDriver(qp);
const session = require('express-session');

// const scheduler = require(`./controllers/scheduler_helper/scheduler`);
// scheduler.wipeAllSchedulersAndRestart();
const DEBUGGING = typeof v8debug === `object` || /--debug|--inspect/.test(process.execArgv.join(` `));
console.debug = function () {
	if (DEBUGGING) {
		console.log.apply(this, arguments);
	}
};

app.use(
	session({
		secret: 'keyboard cat',
		saveUninitialized: false, // only save upon assigning attribute
		rolling: true, //every call will renew it
		resave: false,
		cookie: {
			expires: 10 * 1000,
		},
	}),
);

initStorage();
async function initStorage() {
	await storage.init({ expiredInterval: 2 * 60 * 1000 }); // run every 2 minutes remove expired items
}

function verifyToken(req, res, next) {
	try {
		req.token = req.headers[`authorization`] || '';
		req.token = req.token.replace(/BEARER /gi, ``);
		jwt.verify(req.token, process.env.JWT_SECRET, async function (err, decoded) {
			if (err) {
				if (err.name === `TokenExpiredError`) {
					err.status = 401;
					err.message = 'Login expired, please login again';
				}
				if (decoded?.token_key) {
					await storage.removeItem(decoded.token_key);
				}
				next(err);
			} else {
				req.user = await storage.getItem(decoded.token_key);
				if (req.user == null || req.user == undefined) {
					const error = new Error('You are not authorized, please login again');
					error.status = 401;
					return next(error);
				}
				const blacklisted = await storage.getItem(`JwtBlacklist:${req.user.id}`);
				if (blacklisted && moment.unix(blacklisted).isAfter(moment.unix(decoded.iat))) {
					const error = new Error('You are not authorized, please login again');
					error.status = 401;
					return next(error);
				}

				const current = moment().format(`YYYY-MM-DD HH:mm:ss`);
				// await qp.run(`update user set last_login = ? where is_available and username = ?`, [current, req.user.username]);

				req.exp = decoded.exp;
				next();
			}
		});
	} catch (error) {
		next(error);
	}
}

function logResponseBody(req, res, next) {
	if (req.method !== `GET` && req.body) {
		var oldWrite = res.write,
			oldEnd = res.end;
		var chunks = [];
		res.write = function (chunk) {
			chunks.push(chunk);
			oldWrite.apply(res, arguments);
		};
		res.end = async function (chunk) {
			if (req.path.includes(`excel`)) {
				oldEnd.apply(res, arguments);
				return;
			}
			try {
				if (chunk) chunks.push(chunk);
				var body = Buffer.concat(chunks).toString(`utf8`);
				const user = req.user;
				const dao = buildDao(req, body, user);

				if (dao.method_url.includes(`POST -> /admin/login`)) {
					dao.req = '{}';
				}
				req.insertId > 0 ? (dao.id = req.insertId) : delete dao.id;
				await qp.run(`insert into activity_log set ? on duplicate key update ?`, [dao, dao]);
				oldEnd.apply(res, arguments);
			} catch (err) {
				oldEnd.apply(res, arguments);
			}
		};
	}
	next();
	function buildDao(req, resBody, user) {
		const dao = {
			method_url: `${req.method} -> ${req.originalUrl}`,
			req: JSON.stringify(req.body),
			res: resBody,
			admin_id: user ? user.id : null,
			admin_name: user ? user.name : '',
		};
		return dao;
	}
}

app.use((req, res, next) => {
	next();
});

app.use(logResponseBody);

require(`./route_paths/0. common`)(app, verifyToken);
require(`./route_paths/1. authentication`)(app, verifyToken);
require(`./route_paths/2. user_management`)(app, verifyToken);
require(`./route_paths/3. file_management`)(app, verifyToken);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	console.log(`${req.method} -> ${req.originalUrl} is not a proper route!`);
	next(createError(404));
});

// error handler
app.use(async function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	const status = err.status || 500;
	res.status(status);
	let response;
	if (err.sql) {
		response = rb.buildError(err.message, status, { sql: err.sql });
	} else {
		response = rb.buildError(err.message, status, err);
	}
	await error_helper.errorLog(err.message, req);
	res.json(response);
});

module.exports = { app: app };
