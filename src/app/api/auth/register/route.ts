import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Semua kolom harus diisi." }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, emailVerified")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Check user error:", checkError);
      return NextResponse.json({ error: "Gagal memeriksa email." }, { status: 500 });
    }

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json({ error: "Email sudah terdaftar dan terverifikasi." }, { status: 400 });
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash password using SHA-256 (safe & built-in)
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    
    let userId;
    if (existingUser) {
      userId = existingUser.id;
      // Update unverified user password/name in case they re-submitted
      const { error: updateError } = await supabase
        .from("users")
        .update({ name, password: hashedPassword })
        .eq("id", userId);

      if (updateError) {
        console.error("Update user error:", updateError);
        return NextResponse.json({ error: "Gagal memperbarui data pengguna." }, { status: 500 });
      }
    } else {
      // Create a new unverified user in the public.users table
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([{ name, email, password: hashedPassword, emailVerified: null }])
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert user error:", insertError);
        return NextResponse.json({ error: "Gagal menyimpan data pengguna." }, { status: 500 });
      }
      userId = newUser.id;
    }

    // Save OTP token in verification_tokens table
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry
    
    // Delete any old OTP tokens for this email first
    await supabase.from("verification_tokens").delete().eq("identifier", email);

    const { error: tokenError } = await supabase
      .from("verification_tokens")
      .insert([{ identifier: email, token: otp, expires }]);

    if (tokenError) {
      console.error("Insert token error:", tokenError);
      return NextResponse.json({ error: "Gagal membuat kode OTP." }, { status: 500 });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;

    // Developer mode fallback if email configuration is missing
    if (!smtpUser || !smtpPass || smtpUser.includes("your-email") || smtpPass.includes("your-app-password")) {
      console.log(`[DEV MODE] OTP generated for ${email}: ${otp}`);
      return NextResponse.json({ 
        success: true,
        message: "Akun disiapkan (Mode Pengembangan: silakan gunakan OTP di bawah).",
        otp,
        devMode: true 
      });
    }

    // Send email using Nodemailer
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // TLS
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"SignEase" <${smtpUser}>`,
      to: email,
      subject: "Kode OTP Registrasi SignEase Anda",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #4f46e5; text-align: center; margin-bottom: 24px;">Verifikasi Akun SignEase Anda</h2>
          <p>Halo <strong>${name}</strong>,</p>
          <p>Terima kasih telah mendaftar di SignEase. Gunakan kode OTP di bawah ini untuk menyelesaikan proses pendaftaran Anda:</p>
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center;">Kode OTP ini berlaku selama 15 menit. Jangan bagikan kode ini kepada siapa pun.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">© 2026 SignEase Digital Assurance.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "OTP terkirim ke email." });
  } catch (error: any) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
