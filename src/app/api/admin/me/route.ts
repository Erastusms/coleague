import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: admin,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin session check error:", error);
    return NextResponse.json(
      { authenticated: false, user: null, error: msg },
      { status: 500 }
    );
  }
}
