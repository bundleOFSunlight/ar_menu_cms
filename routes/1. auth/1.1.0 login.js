const express = require('express');
const router = express.Router();
const rb = require(`@flexsolver/flexrb`);
const qp = require(`@flexsolver/flexqp2`);
const jwt = require(`jsonwebtoken`);
const JWT_SECRET = process.env.JWT_SECRET;
const moment = require(`moment`);
const passwordHash = require(`password-hash`);
const storage = require('node-persist');
const { keys } = require('node-persist');
const { v4: uuidv4 } = require('uuid');
/**
 * API 1.1.1 Login
 */
router.post(`/`, async function (req, res, next) {
    let con;
    const body = { ...req.body };
    try {
        con = await qp.connectWithTbegin();
        const user = await qp.selectFirst(
            `select u.id, u.username, u.password, u.email, u.contact, u.is_first_login, u.role, u.is_active
            from user u where u.is_available and u.email = ? and role <>?`,
            [body.email.trim(), 'SUPPLIER'],
            con,
        );
        if (user) {
            if (!user.is_active) {
                const error = new Error(`Your account is inactive, please contact admin.`);
                error.status = 401;
                throw error;
            }

            if (!passwordHash.verify(body.password, user.password)) {
                const error = new Error(`Invalid email or password.`);
                error.status = 401;
                throw error;
            }

            // if (user.group === 'SUPPLIER') {
            //     const error = new Error(`Supplier account is not for this url use ${process.env.FE_URL_SUPPLIER_PORTAL} instead`);
            //     error.status = 401;
            //     throw error;
            // }

            delete user.password;

            // const token_obj = JSON.parse(JSON.stringify(user));
            // delete token_obj.accessibility;
            delete user.is_first_login;

            // stay login or normal login
            // const login_duration_hours = body.is_stayed_login ? 24 * 365 : 8;
            const uuidx = uuidv4();
            const token = jwt.sign(
                {
                    exp: moment()
                        .add(process.env.JWT_DEFAULT_TIME || 1, 'day')
                        .unix(),
                    token_key: uuidx,
                },
                JWT_SECRET,
            );
            // const longLive = `Regulatory:${uuidv4()}`;
            await storage.setItem(uuidx, user, { ttl: (process.env.JWT_DEFAULT_TIME || 30) * 24 * 60 * 60 * 1000 });

            user.token = token;
            // user.longLive = longLive;
            const current = moment().format(`YYYY-MM-DD HH:mm:ss`);
            const user_dao = {
                last_login: current,
            };
            await qp.run(`update user set ? where is_available and id = ?`, [user_dao, user.id], con);
            // const expiry = moment().add(login_duration_hours, 'hour').format('YYYY-MM-DD HH:mm:ss');
            // await qp.run('insert into long_live_token set ?', [{ token: longLive, user_id: user.id, expiry: expiry }], con);

            await qp.commitAndCloseConnection(con);
            res.json(rb.build(user, `Success`));
        } else {
            const error = new Error(`Invalid username or password.`);
            error.status = 401;
            throw error;
        }
    } catch (error) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(error);
    }
});

module.exports = router;
