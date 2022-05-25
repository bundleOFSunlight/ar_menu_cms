const qp = require(`@flexsolver/flexqp2`);
const generator = require('generate-password');

function findDuplicates(array, field_name) {
    let findDuplicate = arr => arr.filter((item, index) => arr.indexOf(item) != index);
    let duplicate_name = findDuplicate(array);
    if (duplicate_name.length) {
        throw new Error(`${field_name} cannot be duplicated`);
    }
}

function removeItemFromArray(item, array) {
    const index = array.indexOf(item);
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}

function checkDuplicatesInArray(array, err_name) {
    const findDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) != index);
    const all_uppercase = array.map((name) => name.toUpperCase());
    const check_duplicate = [...new Set(findDuplicates(all_uppercase))];
    if (check_duplicate.length > 0) {
        const err = new Error(`${err_name}: ${check_duplicate[0]} duplicate.`);
        err.status = 409;
        throw err;
    }
}

async function checkItemExist(id, table_name, con) {
    try {
        const result = await qp.selectFirst(`select * from ?? where is_available and id = ?`, [table_name, id], con);
        if (!result) {
            const err = new Error(`${table_name} #${id} does not exist`);
            err.status = 406;
            throw err;
        }
        return result;
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        throw err;
    }
}

async function checkItemDuplicate(table_name, item_key, item_value, con, id) {
    try {
        if (id && typeof id === `string`) {
            id = parseInt(id);
        }
        const result = await qp.selectFirst(`select * from ?? where ?? = ?`, [table_name, item_key, item_value], con);
        if (result && id === result.id) {
            return 0;
        } else if (result) {
            const err = new Error(`${table_name} #${item_key}: ${item_value} duplicate.`);
            err.status = 409;
            throw err;
        }
        return 0;
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        throw err;
    }
}

async function checkInputDuplicate(table_name, item_key, item_value, con, dao) {
    try {
        if (dao.id && typeof dao.id === `string`) {
            dao.id = parseInt(dao.id);
        }
        let params = ``;
        for (const [key, value] of Object.entries(dao)) {
            if (key !== 'id') {
                // if statement only for PLC and SUPPLIER account API
                if (value === "PLC" || value === "PARTNER") {
                    // SUPPLIER and PARNER should able to duplicate
                    params += "and `group` in ('PLC', 'PARTNER')"
                } else {
                    params += 'and `' + key + '`' + ` = '${value}'`
                }
            }
        }
        const result = await qp.selectFirst(`select * from ?? where ?? = ? ${params}`, [table_name, item_key, item_value], con);
        if (result && dao.id === result.id) {
            return 0;
        } else if (result) {
            const err = new Error(`${table_name} #${item_key}: ${item_value} duplicate.`);
            err.status = 409;
            throw err;
        }
        return 0;
    } catch (err) {
        if (con) await qp.rollbackAndCloseConnection(con);
        throw err;
    }
}

function generateRandomPassword(length, need_number, need_uppercase) {
    const password = generator.generate({
        length: length,
        numbers: need_number,
        uppercase: need_uppercase,
    });
    return password;
}

module.exports = {
    removeItemFromArray: removeItemFromArray,
    checkDuplicatesInArray: checkDuplicatesInArray,
    checkItemExist: checkItemExist,
    generateRandomPassword: generateRandomPassword,
    checkItemDuplicate: checkItemDuplicate,
    checkInputDuplicate: checkInputDuplicate,
    findDuplicates: findDuplicates,
};
