import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  ensureDefaultAdmin,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Ensure default admin exists if table is empty
    await ensureDefaultAdmin();

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: String(username).trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    if (user.userType !== "admin") {
      return NextResponse.json(
        { error: "Access denied. Only admin users may log in here." },
        { status: 403 }
      );
    }

    // Create session token
    const token = createSessionToken({
      id: user.id,
      username: user.username,
      userType: user.userType,
      name: user.name,
    });

    const res = NextResponse.json({
      success: true,
      message: "Admin login successful.",
      user: {
        id: user.id,
        username: user.username,
        userType: user.userType,
        name: user.name,
        email: user.email,
      },
    });

    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;
  } catch (error: unknown) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
