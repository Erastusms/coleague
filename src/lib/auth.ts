import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.CRON_SECRET ||
  "coleague-super-secret-admin-session-salt-2026";

export const ADMIN_COOKIE_NAME = "coleague_admin_session";

export interface SessionUser {
  userId: string;
  username: string;
  userType: string;
  name?: string | null;
  exp: number;
}

/**
 * Hash password with secure scrypt and a cryptographically random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

/**
 * Verify password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Create a signed session token
 */
export function createSessionToken(user: {
  id: string;
  username: string;
  userType: string;
  name?: string | null;
}): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days expiration
  const payload: SessionUser = {
    userId: user.id,
    username: user.username,
    userType: user.userType,
    name: user.name,
    exp,
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadStr)
    .digest("base64url");
  return `${payloadStr}.${signature}`;
}

/**
 * Verify a signed session token
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [payloadStr, signature] = token.split(".");
    if (!payloadStr || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payloadStr)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: SessionUser = JSON.parse(
      Buffer.from(payloadStr, "base64url").toString("utf-8")
    );

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Get current admin session from incoming cookies (supporting Request or Next.js cookies())
 */
export async function getAdminSession(
  req?: Request | { cookies?: { get: (name: string) => { value?: string } | undefined } }
): Promise<SessionUser | null> {
  try {
    let token: string | undefined;

    // Check request cookies if available
    if (req && "cookies" in req && typeof req.cookies?.get === "function") {
      token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    }

    // Fall back to Next.js cookies()
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
      } catch {
        // Outside request scope or not available
      }
    }

    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Get full user record for active admin session
 */
export async function getCurrentAdmin(
  req?: Request | { cookies?: { get: (name: string) => { value?: string } | undefined } }
) {
  const session = await getAdminSession(req);
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        userType: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

/**
 * Automatically ensure a default admin user exists if the user table is empty
 */
export async function ensureDefaultAdmin() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      const defaultUsername = "admin";
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "admin123";
      await prisma.user.create({
        data: {
          username: defaultUsername,
          password: hashPassword(defaultPassword),
          userType: "admin",
          name: "System Administrator",
          email: "admin@coleague.internal",
        },
      });
      console.log(`[Auth] Created default admin user: ${defaultUsername}`);
    }
  } catch (error) {
    console.error("[Auth] Error verifying default admin existence:", error);
  }
}
