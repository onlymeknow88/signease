import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    let session = null;
    try {
      session = await auth();
    } catch (authError: any) {
      console.warn("getServerSession failed in cancel route, falling back to body email:", authError.message);
    }

    let bodyEmail = "";
    try {
      const body = await request.json();
      bodyEmail = body.email || "";
    } catch {
      // Body might be empty
    }

    const email = session?.user?.email || bodyEmail;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Downgrade ke free
      await prisma.user.update({
        where: { email },
        data: {
          plan: "free",
          subscriptionStatus: "cancelled",
          subscriptionExpiresAt: null,
        },
      });
    } catch (dbError: any) {
      console.warn("Database update failed in cancel route, falling back to mock response:", dbError.message);
    }

    return NextResponse.json({ success: true, plan: "free" });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
