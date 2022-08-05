const express = require("express");
const router = express.Router();
const rb = require("@flexsolver/flexrb");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const upload = multer({ dest: 'uploads/' })
const cloudinary = require("../../resources/cloudinary")

/**
 * 0.1.1
 * Upload image
 */
router.post(`/`, upload.single('mind_ar'), async function (req, res, next) {
    try {
        req.setTimeout(0);
        let file = req.file;
        const result = await cloudinary.uploader(file)
        const file_path = path.join(__dirname, `../../uploads`)
        fs.rmSync(file_path, { recursive: true });
        res.json(rb.build({ url: result.secure_url }, `File has been uploaded.`));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
