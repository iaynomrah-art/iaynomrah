"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "@/lib/portal/password";
import { endPortalSession, getPortalSession, startPortalSession } from "@/lib/portal/session";

// Actions the account owner runs from the portal pages (no admin login involved).

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const INVALID_LOGIN = "Incorrect email or password";

export async function portalLogin(email: string, password: string) {
    const admin = createAdminClient();
    if (!admin) return { error: "The portal isn't configured yet. Please contact the team." };

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const { data: login } = await admin
        .from("portal_logins")
        .select("account_id, password_hash, session_version, failed_attempts, locked_until")
        .eq("email", normalizedEmail)
        .maybeSingle();

    const now = Date.now();
    const lockedUntil = login?.locked_until ? new Date(login.locked_until).getTime() : 0;
    if (lockedUntil > now) {
        const minutes = Math.ceil((lockedUntil - now) / 60000);
        return { error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
    }

    // verifyPassword does the full hashing work even when there's no login, so
    // unknown emails can't be told apart by response time.
    const ok = await verifyPassword(String(password || ""), login?.password_hash);
    if (!login || !ok) {
        if (login?.password_hash) {
            // An expired lock starts the count over
            const previous = lockedUntil ? 0 : login.failed_attempts || 0;
            const attempts = previous + 1;
            await admin
                .from("portal_logins")
                .update({
                    failed_attempts: attempts,
                    locked_until: attempts >= MAX_FAILED_ATTEMPTS ? new Date(now + LOCK_MINUTES * 60000).toISOString() : null,
                    updated_at: new Date().toISOString(),
                })
                .eq("account_id", login.account_id);
        }
        return { error: INVALID_LOGIN };
    }

    await admin
        .from("portal_logins")
        .update({ failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
        .eq("account_id", login.account_id);

    await startPortalSession(login.account_id, login.session_version);
    return { success: true };
}

/** Change the logged-in owner's password (e.g. replacing the one the admin set). */
export async function changePortalPassword(currentPassword: string, newPassword: string) {
    const session = await getPortalSession();
    if (!session) return { error: "Your session has expired. Please log in again." };

    const admin = createAdminClient();
    if (!admin) return { error: "The portal isn't configured yet. Please contact the team." };

    if (String(newPassword || "").length < MIN_PASSWORD_LENGTH) {
        return { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` };
    }

    const { data: login } = await admin
        .from("portal_logins")
        .select("password_hash, session_version")
        .eq("account_id", session.accountId)
        .maybeSingle();

    if (!login || !(await verifyPassword(String(currentPassword || ""), login.password_hash))) {
        return { error: "Your current password is incorrect" };
    }

    // Signs out every other session; this one gets a fresh cookie below
    const sessionVersion = (login.session_version || 1) + 1;
    const { error } = await admin
        .from("portal_logins")
        .update({
            password_hash: await hashPassword(newPassword),
            session_version: sessionVersion,
            updated_at: new Date().toISOString(),
        })
        .eq("account_id", session.accountId);

    if (error) return { error: "Couldn't save your password. Please try again." };

    await startPortalSession(session.accountId, sessionVersion);
    return { success: true };
}

export async function portalLogout() {
    await endPortalSession();
    return { success: true };
}
