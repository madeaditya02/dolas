import nodemailer from "nodemailer";
import "dotenv/config"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (to: string, token: string) => {
  // Arahkan link ke Frontend Next.js Anda (misal: http://localhost:3000/verify-email?token=...)
  const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: '"Finance AI" <noreply@financeai.com>',
    to,
    subject: "Verifikasi Email Anda - Finance AI",
    html: `
      <h2>Selamat Datang di Finance AI!</h2>
      <p>Silakan klik tautan di bawah ini untuk memverifikasi email Anda:</p>
      <a href="${verificationUrl}" target="_blank" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Verifikasi Email</a>
      <p>Tautan ini akan kedaluwarsa dalam 1 jam.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};