const redis = require("redis");
const client = redis.createClient(process.env.REDIS);
client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();

async function setTableRow(table_id, column, value) {
    try {
        const key = `${process.env.PROJECT}${process.env.ENVIRONMENT}${table_id}`
        await client.HSET(`${key}`, `${column}`, value);
    } catch (err) {
        throw err
    }
}
async function getTableRow(table_id, column) {
    try {
        const key = `${process.env.PROJECT}${process.env.ENVIRONMENT}${table_id}`
        return await client.HGET(key, column);
    } catch (err) {
        throw err
    }
}
async function getTableColumn(table_id) {
    try {
        const key = `${process.env.PROJECT}${process.env.ENVIRONMENT}${table_id}`
        return await client.HKEYS(key);
    } catch (err) {
        throw err
    }
}

module.exports = {
    setTableRow: setTableRow,
    getTableRow: getTableRow,
    getTableColumn: getTableColumn,
}