import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { repo } from "@/lib/db/repo";

/** 本地账号体系（零外部依赖）：scrypt 密码哈希 + httpOnly cookie 会话。 */

export const SESSION_COOKIE = "oc_session";
const SESSION_DAYS = 30;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const calc = scryptSync(password, salt, 64);
    const expect = Buffer.from(hash, "hex");
    return calc.length === expect.length && timingSafeEqual(calc, expect);
  } catch {
    return false;
  }
}

export function createSession(userId: string): string {
  const token = randomBytes(32).toString("hex");
  repo.createSession(token, userId, Date.now() + SESSION_DAYS * 86_400_000);
  return token;
}

/** 从请求 Cookie 头解析会话用户 */
export function getUserFromRequest(req: Request): AuthUser | null {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)oc_session=([^;]+)/);
  if (!m) return null;
  const user = repo.findSessionUser(decodeURIComponent(m[1]));
  return user ? { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt } : null;
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86_400}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function newUserId(): string {
  return `u-${Date.now()}-${randomUUID().slice(0, 8)}`;
}
