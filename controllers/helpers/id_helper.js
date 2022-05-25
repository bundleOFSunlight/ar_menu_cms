const qp = require('@flexsolver/flexqp2');

// assuming that all are named as "id"
module.exports = async (con, table, is_next, id = 'id') => {
    if (!con) {
        throw new Error(`connection must be defined in id helper`);
    }
    id = await qp.scalarFirst(`select ifnull(max(??), 0) from ??`, [id, table], con);
    if (is_next) {
        id += 1;
    }
    return id;
}