const express = require('express');
const router = express.Router();
const qp = require('@flexsolver/flexqp2');
const rb = require('@flexsolver/flexrb');
const jwt = require(`jsonwebtoken`);
const moment = require(`moment`);
const JWT_SECRET = process.env.JWT_SECRET;
const email_helper = require(`../../controllers/helpers/email_helper`);
const { v4: uuidv4 } = require('uuid');

/**
 * API 1.2.1 forgot password
 *
 */
router.put(`/`, async function (req, res, next) {
    let con;
    try {
        con = await qp.connectWithTbegin();
        const body = { ...req.body };

        const user = await qp.selectFirst(`select * from user u where u.is_available and u.email = ?`, [body.email.trim()], con);
        if (!user) {
            const error = new Error('This email is not registered.');
            throw error;
        }
        if (!user.is_active) {
            throw new Error('Your account is inactive, please contact admin.');
        }
        const reset_token = uuidv4();
        await qp.run('update user set reset_token = ?, reset_time = now() where id =?', [reset_token, user.id], con);
        await email_helper.resetPassword(user, reset_token, con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build({}, `Password reset instructions sent to ${body.email}, please check.`));
    } catch (error) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(error);
    }
});

module.exports = router;
