"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/portal/password";

// Admin-side management of owner portal access. Owner logins live in
// portal_logins (not Supabase Auth); only the service role can touch that table,
// so every action first checks the caller is an admin who can see the owner.

export type PortalAccessStatus = "active";

/** Turn the database errors an admin can actually fix into plain instructions. */
function describeDbError(message: string): string {
    if (/unauthorized|invalid.*(jwt|key|api)|401/i.test(message)) {
        return "Supabase rejected the server key. Check SUPABASE_SERVICE_ROLE_KEY in .env, then restart the app";
    }
    if (/portal_logins/i.test(message) && /does not exist|schema cache/i.test(message)) {
        return "The portal_logins table is missing. Run migration_owner_portal.sql in the Supabase SQL editor";
    }
    return message;
}

async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error("[portal-actions] Could not verify the caller's login:", userError);
        return { error: `Unauthorized: couldn't verify your login (${userError?.message || "no session"}). Try refreshing the page.` } as const;
    }
    const role = user.app_metadata?.role;
    if (role !== "admin" && role !== "super-admin") {
        return { error: "Forbidden: only admins can manage portal access" } as const;
    }
    const admin = createAdminClient();
    if (!admin) {
        return { error: "The owner portal isn't configured: add SUPABASE_SERVICE_ROLE_KEY to the server environment" } as const;
    }
    return { supabase, admin } as const;
}

/** Owners (among those the caller can see) that have a portal login. */
export async function getPortalAccessStatuses(): Promise<Record<string, PortalAccessStatus>> {
    const ctx = await requireAdmin();
    if ("error" in ctx) return {};

    // The caller's own RLS decides which owners they may see
    const { data: visible } = await ctx.supabase.from("accounts").select("id");
    const ids = (visible || []).map((a) => a.id);

    // Chunked so a large owner list doesn't overflow the request URL
    const statuses: Record<string, PortalAccessStatus> = {};
    for (let i = 0; i < ids.length; i += 200) {
        const { data: logins } = await ctx.admin
            .from("portal_logins")
            .select("account_id")
            .in("account_id", ids.slice(i, i + 200))
            .not("password_hash", "is", null);
        for (const l of logins || []) {
            statuses[l.account_id] = "active";
        }
    }
    return statuses;
}

/**
 * Create the owner's portal login, or reset its password. They log in at
 * /portal/login with the email on their account record and this password.
 * Resetting signs out every existing session.
 */
export async function setPortalPassword(accountId: string, password: string) {
    try {
        if (String(password || "").length < MIN_PASSWORD_LENGTH) {
            return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
        }

        const ctx = await requireAdmin();
        if ("error" in ctx) return { error: ctx.error };

        const { data: account } = await ctx.supabase
            .from("accounts")
            .select("id, email")
            .eq("id", accountId)
            .maybeSingle();
        if (!account) return { error: "Account not found" };

        const email = String(account.email || "").trim().toLowerCase();
        if (!email) return { error: "This owner has no email address" };

        const { data: existing } = await ctx.admin
            .from("portal_logins")
            .select("account_id, session_version")
            .eq("email", email)
            .maybeSingle();
        if (existing && existing.account_id !== account.id) {
            return { error: "Another owner already uses this email for the portal" };
        }

        const { data: current } = await ctx.admin
            .from("portal_logins")
            .select("session_version")
            .eq("account_id", account.id)
            .maybeSingle();

        const { error } = await ctx.admin.from("portal_logins").upsert(
            {
                account_id: account.id,
                email,
                password_hash: await hashPassword(password),
                session_version: (current?.session_version || 0) + 1, // signs out old sessions
                setup_token_hash: null,
                setup_token_expires_at: null,
                failed_attempts: 0,
                locked_until: null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "account_id" }
        );
        if (error) return { error: `Failed to save the login: ${describeDbError(error.message)}` };

        return { success: true, email };
    } catch (error) {
        console.error("Set portal password error:", error);
        return { error: "An unexpected error occurred" };
    }
}

/** Remove the owner's portal login. Their existing sessions stop working immediately. */
export async function revokePortalAccess(accountId: string) {
    try {
        const ctx = await requireAdmin();
        if ("error" in ctx) return { error: ctx.error };

        const { data: account } = await ctx.supabase.from("accounts").select("id").eq("id", accountId).maybeSingle();
        if (!account) return { error: "Account not found" };

        const { error } = await ctx.admin.from("portal_logins").delete().eq("account_id", account.id);
        if (error) return { error: describeDbError(error.message) };
        return { success: true };
    } catch (error) {
        console.error("Revoke portal access error:", error);
        return { error: "An unexpected error occurred" };
    }
}
