// File: SendAdminOtp.js

const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text }) => {
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
    });
};

module.exports = sendEmail;