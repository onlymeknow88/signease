import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email dan OTP wajib diisi." }, { status: 400 });
    }

    // Verify OTP token in database
    const { data: tokenRecord, error: tokenError } = await supabase
      .from("verification_tokens")
      .select("*")
      .eq("identifier", email)
      .eq("token", otp)
      .maybeSingle();

    if (tokenError) {
      console.error("Token query error:", tokenError);
      return NextResponse.json({ error: "Gagal memverifikasi kode OTP." }, { status: 500 });
    }

    if (!tokenRecord) {
      return NextResponse.json({ error: "Kode OTP salah atau tidak valid." }, { status: 400 });
    }

    // Check expiry
    const isExpired = new Date(tokenRecord.expires).getTime() < Date.now();
    if (isExpired) {
      // Clean up expired token
      await supabase.from("verification_tokens").delete().eq("identifier", email).eq("token", otp);
      return NextResponse.json({ error: "Kode OTP telah kedaluwarsa. Silakan kirim ulang." }, { status: 400 });
    }

    // Mark user as verified in database
    const { error: updateError } = await supabase
      .from("users")
      .update({ emailVerified: new Date().toISOString() })
      .eq("email", email);

    if (updateError) {
      console.error("User verification update error:", updateError);
      return NextResponse.json({ error: "Gagal mengaktifkan akun." }, { status: 500 });
    }

    // Clean up used token
    await supabase.from("verification_tokens").delete().eq("identifier", email).eq("token", otp);

    // Get user details to return
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", email)
      .single();

    if (userError) {
      console.error("User fetch error:", userError);
      return NextResponse.json({ error: "Gagal mengambil data pengguna." }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error: any) {
    console.error("Verify OTP API error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
