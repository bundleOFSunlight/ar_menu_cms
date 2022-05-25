const qp = require('@flexsolver/flexqp2');

function Model() {
    this.query = `select * from jwt_black_list where datetime > current_date()`;
    this.createQuery =
        'CREATE TABLE `jwt_black_list` ( `token` varchar(2000) NOT NULL, `datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`token`) );';
    this.data = null;
    this.init = async () => {
        try {
            this.data = await qp.selectMap(`token`, this.query);
        } catch (err) {
            if (err.sqlState === `42S02`) {
                await qp.run(this.createQuery);
                this.data = await qp.selectMap(`token`, this.query);
            } else {
                console.log(err);
            }
        }
    };
}

module.exports = new Model();
