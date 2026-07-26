import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.arrayBuffer();
    
    // Proxy the request to public DigiCert TSA
    const res = await fetch("http://timestamp.digicert.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/timestamp-query",
      },
      body,
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "TSA request failed" }, { status: res.status });
    }
    
    const resBytes = await res.arrayBuffer();
    return new NextResponse(resBytes, {
      headers: {
        "Content-Type": "application/timestamp-reply",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
