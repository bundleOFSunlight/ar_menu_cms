const express = require(`express`);
const router = express.Router();
const rb = require(`@flexsolver/flexrb`);
const qp = require(`@flexsolver/flexqp2`);
const { v4: uuidv4 } = require('uuid');
const id_helper = require(`../../controllers/helpers/id_helper`);

// 3.1.0
router.post(`/new_project`, async function (req, res, next) {
    let con;
    try {
        let body = { ...req.body };
        con = await qp.connectWithTbegin();
        const project = await qp.selectFirst(`select * from project where is_available and project_name = ?`,
            [body.project_name], con);
        if (project) {
            throw new Error(`project name already exists.`);
        }
        body.public_key = uuidv4();
        let project_builder = await qp.getBuilderSingleton(`project`, con);
        const project_dao = project_builder.construct(body);
        await qp.run(`insert into project set ?`, [project_dao], con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build({}, `New prject created.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});

// 3.2.0
router.post(`/datatable`, async function (req, res, next) {
    let con;
    try {
        let body = { ...req.body };
        con = await qp.connectWithTbegin();
        const project = await qp.select(`select * from project where is_available order by id desc`,
            [], con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build(project, `All prject Retrieved.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});

// 3.3.0
router.get(`/all_project/:id`, async function (req, res, next) {
    let con;
    try {
        const id = req.params.id;
        con = await qp.connectWithTbegin();
        const project = await qp.selectFirst(`select * from project where is_available and id = ?`,
            [id], con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build(project, `All prject Retrieved.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});

// 3.4.0
router.post(`/add_file`, async function (req, res, next) {
    let con;
    try {
        let body = { ...req.body };
        con = await qp.connectWithTbegin();
        const project = await qp.selectFirst(`select * from project_attachment where is_available and file_name = ?`,
            [body.file_name], con);
        if (project) {
            throw new Error(`File name already exists.`);
        }
        let max_arrangement = await qp.scalarFirst(`select ifnull(max(arrangement), 0) from project_attachment where is_available and project_id = ?`, [body.project_id]);
        max_arrangement += 1;
        body.arrangement = max_arrangement;
        let project_builder = await qp.getBuilderSingleton(`project_attachment`, con);
        const project_dao = project_builder.construct(body);
        await qp.run(`insert into project_attachment set ?`, [project_dao], con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build({}, `New prject attachment added.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});

// 3.5.0
router.get(`/project_file/:id`, async function (req, res, next) {
    let con;
    try {
        const project_id = req.params.id;
        con = await qp.connectWithTbegin();
        const project = await qp.selectFirst(`select * from project where is_available and id = ?`,
            [project_id], con);
        if (!project) { throw new Error("Project not exist"); }
        const attachment = await qp.select(`select * from project_attachment 
        where is_available and project_id = ?`,
            [project.id], con);
        project.attachment = attachment;
        await qp.commitAndCloseConnection(con);
        res.json(rb.build(project, `Prject Retrieved.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});

// 3.6.0
router.get(`/uuid/:id`, async function (req, res, next) {
    let con;
    try {
        const project_id = req.params.id;
        con = await qp.connectWithTbegin();
        const project = await qp.selectFirst(`select * from project where is_available and id = ?`,
            [project_id], con);
        if (!project) { throw new Error("Project not exist"); }
        const api_key = project.public_key;
        await qp.commitAndCloseConnection(con);
        res.json(rb.build(api_key, `Prject Retrieved.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});

// 3.7.0
router.post(`/project`, async function (req, res, next) {
    let con;
    try {
        let body = { ...req.body };
        body.user_id = req.user.id;
        con = await qp.connectWithTbegin();
        const project = await qp.selectFirst(`select * from project where is_available and project_name = ?`,
            [body.project_name], con);
        if (project) {
            throw new Error(`project name already exists.`);
        }
        body.public_key = uuidv4();
        // insert into project
        const id = await id_helper(con, `project`, true);
        let project_builder = await qp.getBuilderSingleton(`project`, con);
        const project_dao = project_builder.construct(body);
        project_dao.id = id;
        await qp.insert(`project`, project_dao, con);
        // mass insert into files
        const videoList = []
        let i = 0;
        for (const item of body.imageList) {
            i++;
            const video_body = {};
            video_body.arrangement = i;
            video_body.project_id = id;
            video_body.file_name = item.name;
            video_body.file_url = item.url;
            video_body.file_size = item.size;
            let project_builder = await qp.getBuilderSingleton(`project_attachment`, con);
            const project_dao = project_builder.construct(video_body);
            videoList.push(project_dao)
        }
        await qp.bulkInsert(`project_attachment`, videoList, [], con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build({}, `New prject created.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});

module.exports = router;
