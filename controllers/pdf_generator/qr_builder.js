module.exports = async function singleQrCodeBuilder(url) {
    try {
        let body = {
            table: {
                widths: [`auto`],
                body: [
                    [
                        { qr: url, alignment: `center`, border: [0, 0, 0, 0] }
                    ],
                ]
            },
            alignment: 'center',
            margin: [200, 80, 0, 0],
            layout: {
                hLineColor: function (i, node) {
                    return 'gray';
                },
                vLineColor: function (i, node) {
                    return "white";
                },
                hLineStyle: function (i, node) {
                    if (i === 0 || i === node.table.body.length) {
                        return null;
                    }
                    return { solid: { length: 10, space: 4 } };
                },
            }
        };
        return body;
    } catch (err) {
        throw err;
    }
}
