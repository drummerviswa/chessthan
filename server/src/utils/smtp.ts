import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter;

if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });
} else {
    // Fallback to a mock console logger for local development
    console.warn("SMTP credentials not configured in server/.env. Emails will print to console.");
    transporter = {
        sendMail: async (options: any) => {
            console.log("\n=========================================");
            console.log("📨 Chessthan Local SMTP Console Log:");
            console.log(`From:    ${options.from}`);
            console.log(`To:      ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            console.log("-----------------------------------------");
            console.log("Content:");
            console.log(options.html || options.text);
            console.log("=========================================\n");
            return { messageId: "mock-smtp-message-id" };
        }
    } as any;
}

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        await transporter.sendMail({
            from: smtpUser || '"Chessthan Support" <support@chessthan.local>',
            to,
            subject,
            html
        });
    } catch (e) {
        console.error("Nodemailer sendEmail error:", e);
        throw e;
    }
};
