const express = require(`express`);
const router = express.Router();
const rb = require(`@flexsolver/flexrb`);
const qp = require(`@flexsolver/flexqp2`);
const { v4: uuidv4 } = require('uuid');
const id_helper = require(`../../controllers/helpers/id_helper`);
const common_helper = require(`../../controllers/helpers/common_helper`);
const download_pdf = require(`../../controllers/pdf_generator/pdf_generator`);

const moment = require(`moment`);

const pdfPrinter = require(`pdfmake/src/printer`);
const printer = new pdfPrinter({
    Roboto: {
        normal: "./fonts/Roboto-Regular.ttf",
        bold: "./fonts/Roboto-Medium.ttf",
        italics: "./fonts/Roboto-Italic.ttf",
        bolditalics: "./fonts/Roboto-Italic.ttf",
    },
});

// 3.2.0
router.post(`/datatable`, async function (req, res, next) {
    let con;
    try {
        const body = { ...req.body }
        const role = req.user.role;
        let role_filter = ``;
        if (role !== "ADMIN") {
            role_filter += "and p.user_id = :user_id"
        }
        const params = {
            user_id: req.user.id,
        }
        const all_query = `select p.*, u.username from project p left join user u on p.user_id = u.id where p.is_available ${role_filter}`;
        const search_query = `${all_query} and (LOWER(contact_person) like concat('%', LOWER(:search), '%') or LOWER(project_name) like concat('%', LOWER(:search), '%'))`;
        res.json(await rb.buildTable(body, search_query, all_query, params));
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
        // verify project
        if (!project) { throw new Error("Project not exist"); }
        // verify user
        const role = req.user.role;
        if (role !== "ADMIN" && project.user_id !== req.user.id) {
            throw new Error("Project not exist");
        }
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

// 3.7.0 create api
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

router.put(`/project`, async function (req, res, next) {
    let con;
    try {
        let body = { ...req.body };
        body.user_id = req.user.id;
        const id = body.id;
        con = await qp.connectWithTbegin();
        // Check exist
        await common_helper.checkItemDuplicate(`project`, `project_name`, body.project_name, con, body.id);
        // check accessible
        const params = {
            user_id: req.user.id,
            id: id,
        }
        let user_filter = ``
        if (req.user.role !== "ADMIN") {
            user_filter = ` and user_id = :user_id`
        }
        const project = await qp.selectFirst(`select * from project where is_available and id = :id ${user_filter}`,
            params, con);
        if (!project) {
            throw new Error(`Project not exist.`);
        }
        body.public_key = project.public_key;
        // insert into project
        let project_builder = await qp.getBuilderSingleton(`project`, con);
        const project_dao = project_builder.construct(body);
        await qp.update(`project`, project_dao, { id: id }, con);
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
        await qp.run(`delete from project_attachment where project_id = ? and is_available`, [id], con)
        await qp.bulkInsert(`project_attachment`, videoList, [], con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build({}, `Prject updated.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});

router.delete(`/project`, async function (req, res, next) {
    let con;
    try {
        let body = { ...req.body };
        body.user_id = req.user.id;
        const id = body.id;
        con = await qp.connectWithTbegin();

        // check accessible
        const params = {
            user_id: req.user.id,
            id: id,
        }
        let user_filter = ``
        if (req.user.role !== "ADMIN") {
            user_filter = ` and user_id = :user_id`
        }
        const project = await qp.selectFirst(`select * from project where is_available and id = :id ${user_filter}`,
            params, con);
        if (!project) {
            throw new Error(`Project not exist.`);
        }
        const polluted_name = `${project.project_name}_` + moment().format(`YYYYMMDDHHmmss`);
        await qp.run(`update project set project_name = :polluted_name, is_available = false where id = :id`, { polluted_name: polluted_name, id: id }, con)
        await qp.run(`update project_attachment set file_name = :puluted_name, is_available = false where project_id = :id`,
            { puluted_name: polluted_name, id: id }, con)

        await qp.commitAndCloseConnection(con);
        res.json(rb.build({}, `Prject deleted.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});

router.post(`/qr_code/:id`, async function (req, res, next) {
    let con;
    const id = req.params.id;
    try {
        con = await qp.connectWithTbegin();
        const project = await qp.selectCheckFirst(`project`, { id: id }, con, function () {
            throw new Error(`Project does not exist.`);
        })
        await qp.commitAndCloseConnection(con);
        const url = process.env.MENU_URL + `/${project.public_key}`;
        const doc_definition = await download_pdf(url);
        const file_name = `QR_CODE` + moment().format('YYYYMMDDHHmmss') + '.pdf';
        const pdf_doc = printer.createPdfKitDocument(doc_definition);
        res.setHeader(`Content-Type`, `application/pdf`);
        res.setHeader(`Content-Disposition`, `attachment; filename=` + file_name);
        pdf_doc.pipe(res);
        pdf_doc.end();

        // res.json(rb.build({}, `Prject deleted.`));
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        next(err);
    }
});

module.exports = router;
