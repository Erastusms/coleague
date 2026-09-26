import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  try {
    const res = NextResponse.json({
      success: true,
      message: "Admin logged out successfully.",
    });
    res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  } catch (error: unknown) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout." },
      { status: 500 }
    );
  }
}
