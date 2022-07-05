const singleQrCodeBuilder = require(`./qr_builder`)

module.exports = async (url) => {
    try {
        let content = [];
        let new_content = await singleQrCodeBuilder(url)
        content.push(new_content);
        let doc_definition = {};
        doc_definition[`styles`] = styles;
        doc_definition[`content`] = content;
        return doc_definition;
    } catch (err) {
        throw err;
    }
}

const styles = {
    normal: {
        bold: false,
        color: "#5c5c5c",
        fontSize: 14,
    },
    medium_title: {
        bold: true,
        fontSize: 14,
    },
    large_title: {
        bold: true,
        fontSize: 25,
    },
    normal_black: {
        bold: false,
        fontSize: 14,
    },
    font18_bold: {
        bold: true,
        fontSize: 18,
    },
    normal_bold: {
        bold: true,
        fontSize: 14,
    },
    font12_bold: {
        bold: true,
        fontSize: 12,
    },
    font12_text: {
        bold: false,
        fontSize: 12,
    },
    font11_bold: {
        bold: true,
        fontSize: 11,
    },
    font11_text: {
        bold: false,
        fontSize: 11,
    },
    medium_bold: {
        bold: true,
        fontSize: 16,
    },
    normal_text: {
        fontSize: 9,
    },
    small_text: {
        fontSize: 4,
    },
    header_table: {
        margin: [10, 10, 10, 10],
    },

};