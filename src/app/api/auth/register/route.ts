import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Semua kolom harus diisi." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    if (existingUser?.emailVerified) {
      return NextResponse.json(
        { error: "Email sudah terdaftar dan terverifikasi." },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash password (SHA-256)
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    if (existingUser) {
      // Update unverified user
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { name, password: hashedPassword },
      });
    } else {
      // Create new unverified user
      await prisma.user.create({
        data: { name, email, password: hashedPassword, emailVerified: null },
      });
    }

    // Upsert OTP token
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: email, token: otp } },
      update: { token: otp, expires },
      create: { identifier: email, token: otp, expires },
    });

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"SignEase" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Kode OTP Pendaftaran SignEase",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Verifikasi Email Anda</h2>
          <p style="color: #475569; font-size: 14px;">Halo <strong>${name}</strong>, gunakan kode berikut untuk menyelesaikan proses pendaftaran Anda:</p>
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center;">Kode OTP ini berlaku selama 15 menit. Jangan bagikan kode ini kepada siapa pun.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">© 2026 SignEase Digital Assurance.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "OTP terkirim ke email." });
  } catch (error: any) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
