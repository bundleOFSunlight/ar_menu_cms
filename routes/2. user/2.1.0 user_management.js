const express = require(`express`);
const router = express.Router();
const rb = require(`@flexsolver/flexrb`);
const qp = require(`@flexsolver/flexqp2`);
const moment = require(`moment`);
const passwordHash = require('password-hash');
const id_helper = require(`../../controllers/helpers/id_helper`);
const common_helper = require(`../../controllers/helpers/common_helper`);
const email_helper = require(`../../controllers/helpers/email_helper`);
// const redis = require(`../../resources/redis`)

/**
 * API 2.1.0 Create a user
 */
router.post(`/`, async function (req, res, next) {
    let con;
    try {
        let body = { ...req.body };
        con = await qp.connectWithTbegin();
        await common_helper.checkItemDuplicate(`user`, `username`, body.username, con); //table_name, column name, column value, con, id optional
        await common_helper.checkItemDuplicate(`user`, `email`, body.email, con); //table_name, column name, column value, con, id optional

        let id = await id_helper(con, `user`, true);

        // generate password and save
        let password = common_helper.generateRandomPassword(10, true, true);
        let hashed_password = passwordHash.generate(password);

        body.id = id;
        body.password = hashed_password;

        // user dao builder
        let user_builder = await qp.getBuilderSingleton(`user`, con);
        let user_dao = user_builder.construct(body);

        await qp.run(`insert into user set ? `, [user_dao], con);

        // send password to new user
        await email_helper.newUserPassword(user_dao, password, con);

        await qp.commitAndCloseConnection(con);

        // redis
        // const key_array = Object.keys(user_dao);
        // for (const key of key_array) {
        //     if (key !== "id") {
        //         await redis.setTableRow(`user${user_dao.id}`, key, user_dao[key]);
        //     }
        // }
        res.json(rb.build(body, `user created.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});
/**
 * API 2.1.3 Get single user
 */
router.get(`/:id`, async function (req, res, next) {
    let con;
    try {
        const id = req.params.id;
        con = await qp.connectWithTbegin();
        await qp.selectCheckFirst(`user`, { is_available: true, id: id }, con, function () {
            throw new Error(`User ${id} does not exist.`);
        });
        const user = await qp.selectFirst(
            `select u.id, u.first_name, u.last_name, u.username, u.email, u.contact,
            u.role, u.last_login, u.is_active from user u where u.is_available and u.id = ?`,
            [id],
            con,
        );
        await qp.commitAndCloseConnection(con);
        res.json(rb.build(user, ` User Retrieved!`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});


module.exports = router;
