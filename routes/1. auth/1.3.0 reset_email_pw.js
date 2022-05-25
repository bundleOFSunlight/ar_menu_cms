const express = require('express');
const router = express.Router();
const qp = require('@flexsolver/flexqp2');
const rb = require('@flexsolver/flexrb');
const jwt = require(`jsonwebtoken`);
const moment = require(`moment`);
const JWT_SECRET = process.env.JWT_SECRET;
const passwordHash = require('password-hash');
const email_helper = require(`../../controllers/helpers/email_helper`)

/**
 * API 1.3.1 Reset Password
 * Use a token to reset password instead of a custom url? very risky
 *
 */
router.put(`/`, async function (req, res, next) {
    let con;
    const { token, new_password, is_first_time } = { ...req.body };
    try {
        con = await qp.connectWithTbegin();
        const user_details = await qp.selectFirst(`select * from user where reset_token = ? and reset_time > DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL -30 MINUTE)`, [token], con);
        if (!user_details) {
            throw new Error('Reset password link expired');
        }
        if (!user_details.is_active) {
            throw new Error('User not activated, please contact admin');
        }
        const hashed_password = passwordHash.generate(new_password);

        await qp.run(`update user set password = ?, is_first_login = false where id = ?`, [hashed_password, user_details.id], con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build({}, `Password is reset.`));
    } catch (error) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(error);
    }
});

module.exports = router;
