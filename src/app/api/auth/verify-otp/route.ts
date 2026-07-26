import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email dan OTP wajib diisi." }, { status: 400 });
    }

    // Look up the OTP token
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token: otp } },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: "Kode OTP salah atau tidak valid." }, { status: 400 });
    }

    // Check expiry
    if (tokenRecord.expires.getTime() < Date.now()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token: otp } },
      });
      return NextResponse.json(
        { error: "Kode OTP telah kedaluwarsa. Silakan kirim ulang." },
        { status: 400 }
      );
    }

    // Mark user as verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Remove used token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: otp } },
    });

    // Return user details
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Gagal mengambil data pengguna." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    console.error("Verify OTP API error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
