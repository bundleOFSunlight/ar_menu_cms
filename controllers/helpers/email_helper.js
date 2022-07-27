const moment = require(`moment`);
const qp = require('@flexsolver/flexqp2');
const nodemailer = require('nodemailer');
const { google } = require(`googleapis`);

const OAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URL)
OAuth2Client.credentials = ({ refresh_token: process.env.REFRESH_TOKEN })

async function newUserPassword(user_dao, password, con) {
    try {
        const title = `"User Invitation"`
        const content = `
        <p>Hi ${user_dao.username}</P>
        <p>You are invited to AR Menu portal</P>
        <p>Use following passord to <a href=#>login</a></P>
        <p>Password: ${password}</P>
        <p></P>
        <p>Regards</P>
        `
        await sendGoogleEmail([user_dao.email], title, content, "User Invitation", con, [], [])
    } catch (err) {
        throw err
    }
}

async function resetPassword(user, token, con) {
    try {
        const reset_password_url = process.env.FE_URL + `/reset-password`;
        // <p> <a href='${reset_password_url}?session=${token}'> Reset my password \n${reset_password_url}?session=${token}</a> </p>

        const subject = `Account Password Reset`;
        const content = `
        <div>
            <p>Dear ${user.username},</p>
            <p>You have requested for Password reset to AR Menu system</p>
            <p> <a href='${reset_password_url}?session=${token}&email=${user.email}'> Click here to reset your password </a> </p>
            <p> This is an automatically generated email. Please do not reply to this email. </p>
        </div> `;
        await sendGoogleEmail(user.email, subject, content, `RESET PASSWORD`, con)
    } catch (err) {
        throw err;
    }
}

async function sendGoogleEmail(to_email_list, subject, content, type, con, cc, bcc) {
    try {
        const accessToken = await OAuth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: 'OAuth2',
                user: process.env.STMP_USERNAME,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken,
            }
        });

        const mailOptions = {
            from: `fyp_noreply@gmail.com`,
            to: to_email_list,
            cc: cc,
            bcc: bcc,
            subject: subject,
            html: content,
        };

        const result = await transporter.sendMail(mailOptions);

        // insert into email log
        const email_log_dao = {
            subject: subject,
            sent_to_email: to_email_list,
            type: type,
            content: content,
        };

        await qp.run(`insert into email_record set ?`, [email_log_dao], con);
        return result;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    newUserPassword: newUserPassword,
    resetPassword: resetPassword,
};

