import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { actionType, geoHash, photo } = await request.json();

    if (!actionType || !geoHash) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a mock IPFS CID based on timestamp + metadata
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(actionType + geoHash + Date.now())
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    const mockCID = `QmQuest${hashHex.substring(0, 38)}`;

    return NextResponse.json({
      success: true,
      cid: mockCID,
      metadata: {
        actionType,
        geoHash,
        timestamp: Date.now(),
        photoUrl: photo || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
