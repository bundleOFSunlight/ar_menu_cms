// this code should be using by frontend, and pass data returned to backend

const cloudinary = require(`cloudinary`);
const { v4: uuidv4 } = require('uuid');

// To Clarissa: Config data should replace yours, in deployment, should use .env file to store config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true
});

async function uploader(file) {
    try {
        // this should replace by "multer" and read from frontend directly
        let file_name = file.originalname;
        file_name = file_name.split('.');
        file_name = file_name[0]
        const image_path = file.path;
        let upload_dao = {
            resource_type: "auto", // resource_type: "auto"
            public_id: `mind_ar/${file_name}/${uuidv4()}`,
        }
        const url = await cloudinary.v2.uploader.upload(image_path, upload_dao);
        return url;
    } catch (err) {
        throw err
    }
}

module.exports = {
    uploader: uploader
}