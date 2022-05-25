const jwtBlackList = require('./singleton-models/jwt_black_list');

async function retrieveOrInit(clearCache, variable) {
    if (clearCache || variable.data == undefined) {
        await variable.init();
    }
    return variable;
}

module.exports = {
    initAll: async () => {
        const clearCache = true;
        await retrieveOrInit(clearCache, jwtBlackList);
        // await retrieveOrInit(clearCache, imageUploadConfig);
    },
    getBlackList: async (clearCache) => {
        const resp = await retrieveOrInit(clearCache, jwtBlackList);
        return resp.data;
    },
}
