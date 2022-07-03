module.exports = async function singleQrCodeBuilder(encrypted_data) {
    try {
        let body = {
            table: {
                widths: [`auto`, `1%`, `34%`, `34%`],
                body: [
                    [
                        {
                            qr: encrypted_data,
                            alignment: `left`,
                            rowSpan: 8,
                            fit: '160',
                            border: [0, 0, 0, 0]
                        },
                    ],
                ]
            }
        };
        return body;
    } catch (err) {
        throw err;
    }
}
