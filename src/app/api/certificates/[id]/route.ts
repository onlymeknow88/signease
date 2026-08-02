import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// DELETE /api/certificates/[id] — remove a certificate (and its metadata)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Ensure the certificate belongs to the requesting user
  const cert = await prisma.certificate.findFirst({
    where: { id, userId: user.id },
    select: { id: true, localStorageKey: true },
  });
  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  await prisma.certificate.delete({ where: { id } });

  // Return the localStorageKey so the client can clean up localStorage
  return NextResponse.json({ localStorageKey: cert.localStorageKey });
}
