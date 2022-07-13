const express = require("express");
let router = express.Router();
let rb = require("@flexsolver/flexrb");
let multer = require("multer");
let fs = require("fs");
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
        console.log(result)
        res.json(rb.build({ url: result.secure_url }, `File has been uploaded.`));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
