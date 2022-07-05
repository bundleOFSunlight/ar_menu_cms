const joi = require('joi');
require('dotenv').config();

// dotenv.config({ path: path.join(__dirname, "../.env") });

const envVarsSchema = joi
    .object()
    .keys({
        ENVIRONMENT: joi.string().valid('PROD', 'DEV', 'QA').required(),
        DB_HOST: joi.string().required(),
        DB_PORT: joi.number().positive().required(),
        DB_USERNAME: joi.string().required(),
        DB_PASSWORD: joi.string().required(),
        DB_DATABASE: joi.string().required(),
        DB_LIMIT: joi.number().positive().required(),

        JWT_SECRET: joi.string().required(),
        FE_URL: joi.string().required(),

        IMAGE_UPLOADER_SECRET: joi.string().required(),
        IMAGE_UPLOADER_FOLDER: joi.string().required(),

        PORT: joi.string().required(),

        STMP_USERNAME: joi.string().required(),
        STMP_KEY: joi.string().required(),

        CLOUD_NAME: joi.string().required(),
        API_KEY: joi.string().required(),
        API_SECRET: joi.string().required(),

        CLIENT_ID: joi.string().required(),
        CLIENT_SECRET: joi.string().required(),
        REDIRECT_URL: joi.string().required(),
        REFRESH_TOKEN: joi.string().required(),
        MENU_URL: joi.string().required(),

    })
    .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: \u001b[1;31m${error.message}\u001b[0m`);
} else {
    console.log('ENV file: \u001b[1;32mOK\u001b[0m');
}

module.exports = {};
