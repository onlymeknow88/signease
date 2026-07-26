// Test SMTP email configuration
// Run: node test-email.js

import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load .env
dotenv.config();

async function testEmail() {
  console.log("Testing SMTP configuration...\n");
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "***" + process.env.SMTP_PASSWORD.slice(-4) : "NOT SET");
  console.log("");

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("✓ SMTP connection successful!\n");

    // Send test email
    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: `"SignEase Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self
      subject: "Test Email from SignEase",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #4f46e5;">SMTP Test Berhasil! ✓</h2>
          <p>Email ini dikirim pada: ${new Date().toLocaleString("id-ID")}</p>
          <p>Konfigurasi SMTP Anda berfungsi dengan baik.</p>
        </div>
      `,
    });

    console.log("✓ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("\nCheck your inbox:", process.env.SMTP_USER);
  } catch (error) {
    console.error("✗ SMTP Error:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Pastikan 2-Step Verification aktif di Google Account");
    console.error("2. Buat App Password baru di: https://myaccount.google.com/apppasswords");
    console.error("3. Update SMTP_PASSWORD di .env dengan App Password 16-digit");
    console.error("4. Restart aplikasi setelah update .env");
    process.exit(1);
  }
}

testEmail();
