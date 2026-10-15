import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// Owner portal sessions: a signed, httpOnly cookie holding the owner's account id
// and their session_version. Bumping session_version in portal_logins (password
// change, access removed) invalidates every session issued before it.

export const PORTAL_COOKIE = "portal_session";
const SESSION_DAYS = 7;
const AUDIENCE = "owner-portal";

function getSecret(): Uint8Array {
    const secret = process.env.PORTAL_SESSION_SECRET || process.env.NEXT_SECRET_KEY;
    if (!secret) {
        throw new Error("PORTAL_SESSION_SECRET (or NEXT_SECRET_KEY) is not set");
    }
    return new TextEncoder().encode(secret);
}

export async function startPortalSession(accountId: string, sessionVersion: number) {
    const token = await new SignJWT({ ver: sessionVersion })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(accountId)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DAYS}d`)
        .sign(getSecret());

    const cookieStore = await cookies();
    cookieStore.set(PORTAL_COOKIE, token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_DAYS * 24 * 60 * 60,
    });
}

export async function endPortalSession() {
    const cookieStore = await cookies();
    cookieStore.delete(PORTAL_COOKIE);
}

/** The logged-in owner's account id, or null. Checks the signature, expiry and that the session wasn't revoked. */
export async function getPortalSession(): Promise<{ accountId: string } | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_COOKIE)?.value;
    if (!token) return null;

    let accountId: string | undefined;
    let version: unknown;
    try {
        const { payload } = await jwtVerify(token, getSecret(), { audience: AUDIENCE, algorithms: ["HS256"] });
        accountId = payload.sub;
        version = payload.ver;
    } catch {
        return null;
    }
    if (!accountId || typeof version !== "number") return null;

    const admin = createAdminClient();
    if (!admin) return null;
    const { data: login } = await admin
        .from("portal_logins")
        .select("session_version, password_hash")
        .eq("account_id", accountId)
        .maybeSingle();

    if (!login?.password_hash || login.session_version !== version) return null;
    return { accountId };
}
