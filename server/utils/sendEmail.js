import { createTransport } from "nodemailer";
import { ENV } from "../config/index.js";

const sendEmail = async (to, subject, body) => {
    try {
        const transporter = createTransport({
            service: "Gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: ENV.MAIL_EMAIL,
                pass: ENV.MAIL_PASS,
            },
        });
        
        const mailOptions = {
            from: ENV.MAIL_EMAIL,
            to,
            subject,
            html: body,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", to);
        console.log("Response:", info.response);
        return { success: true, info };
    } catch (error) {
        console.error("Error sending email to:", to);
        console.error("Error details:", error);
        throw error;
    }
};

export default sendEmail;
