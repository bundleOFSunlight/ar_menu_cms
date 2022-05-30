const express = require(`express`);
const router = express.Router();
const rb = require(`@flexsolver/flexrb`);
const qp = require(`@flexsolver/flexqp2`);

router.get(`/file_obj/:key`, async function (req, res, next) {
    let con;
    try {
        const project_id = req.params.key;
        con = await qp.connectWithTbegin();
        const project = await qp.selectFirst(`select * from project where is_available and public_key = ?`,
            [project_id], con);
        if (!project) { throw new Error("Project not exist"); }
        const attachment_list = await qp.select(`select * from project_attachment 
        where is_available and project_id = ?`,
            [project.id], con);
        const result = [];
        for (const item of attachment_list) {
            result.push(item.file_url)
        };
        await qp.commitAndCloseConnection(con);
        const public_data = {
            data: result,
            mind_file: project.mind_file_url
        }
        res.json(rb.build(public_data, `Prject Retrieved.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});


module.exports = router;
