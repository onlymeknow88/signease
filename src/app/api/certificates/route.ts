import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/certificates — list all certificates for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
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

  const now = new Date();
  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Compute isValid at query time based on expiry
  const result = certificates.map((cert) => ({
    ...cert,
    isValid: cert.validTo > now,
  }));

  return NextResponse.json(result);
}

// POST /api/certificates — register a new certificate metadata
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
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

  const body = await req.json();
  const {
    name,
    commonName,
    issuer,
    serialNumber,
    algorithm,
    validFrom,
    validTo,
    isSelfSigned,
    organization,
    organizationalUnit,
    localStorageKey,
  } = body;

  if (!name || !commonName || !issuer || !serialNumber || !algorithm || !validFrom || !validTo || !localStorageKey) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const now = new Date();
  try {
    const cert = await prisma.certificate.create({
      data: {
        userId: user.id,
        name,
        commonName,
        issuer,
        serialNumber,
        algorithm,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        isValid: new Date(validTo) > now,
        isSelfSigned: isSelfSigned ?? false,
        organization: organization || null,
        organizationalUnit: organizationalUnit || null,
        localStorageKey,
      },
    });
    return NextResponse.json(cert, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Certificate create error:", msg);
    return NextResponse.json(
      { error: `Gagal menyimpan sertifikat ke database: ${msg}` },
      { status: 500 }
    );
  }
}
