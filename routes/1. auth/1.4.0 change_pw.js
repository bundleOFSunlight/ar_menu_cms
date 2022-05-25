const express = require('express');
const router = express.Router();
const qp = require('@flexsolver/flexqp2');
const rb = require('@flexsolver/flexrb');
const passwordHash = require('password-hash');
const email_helper = require(`../../controllers/helpers/email_helper`)
/**
 * API 1.4.1 change password
 */
router.put(`/`, async function (req, res, next) {
    let con;
    const user = { ...req.user };
    try {
        const body = { ...req.body };
        con = await qp.connectWithTbegin();

        const db_user = await qp.selectFirst(`select * from user where is_available and id = ?`, [user.id], con);
        if (!db_user) {
            const error = new Error('This user account does not exist.');
            throw error;
        }
        if (!db_user.is_active) {
            throw new Error('This email is disabled, please contact admin.');
        }
        if (!passwordHash.verify(body.old_password, db_user.password)) {
            const error = new Error('Original password incorrect.');
            throw error;
        }

        let is_active = true;

        const hashed_password = passwordHash.generate(body.new_password);
        await qp.run(`update user set password = ?, is_active = ?, is_first_login = false where id = ?`, [hashed_password, is_active, user.id], con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build({}, `User ${user.username} password has been updated`));
    } catch (error) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(error);
    }
});

module.exports = router;
