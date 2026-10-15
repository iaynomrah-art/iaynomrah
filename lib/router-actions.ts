"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RouterCredentials } from "@/types/units";

// Router admin + GOMO logins per unit. They live in unit_router_credentials,
// which only the service role can touch, so every action first checks the
// caller is a super-admin.

/** Turn the database errors an admin can actually fix into plain instructions. */
function describeDbError(message: string): string {
    if (/unauthorized|invalid.*(jwt|key|api)|401/i.test(message)) {
        return "Supabase rejected the server key. Check SUPABASE_SERVICE_ROLE_KEY in .env, then restart the app";
    }
    if (/unit_router_credentials/i.test(message) && /does not exist|schema cache/i.test(message)) {
        return "The unit_router_credentials table is missing. Run migration_unit_router_credentials.sql in the Supabase SQL editor";
    }
    return message;
}

async function requireSuperAdmin() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return { error: "Unauthorized: couldn't verify your login. Try refreshing the page." } as const;
    }
    if (user.app_metadata?.role !== "super-admin") {
        return { error: "Forbidden: only super-admins can view router credentials" } as const;
    }
    const admin = createAdminClient();
    if (!admin) {
        return { error: "Router credentials aren't configured: add SUPABASE_SERVICE_ROLE_KEY to the server environment" } as const;
    }
    return { user, admin } as const;
}

const clean = (v: unknown) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s;
};

export async function getRouterCredentials(unitId: string): Promise<{ error?: string; data?: RouterCredentials | null }> {
    const ctx = await requireSuperAdmin();
    if ("error" in ctx) return { error: ctx.error };

    const { data, error } = await ctx.admin
        .from("unit_router_credentials")
        .select("router_username, router_password, gomo_email, gomo_password, updated_at")
        .eq("unit_id", unitId)
        .maybeSingle();

    if (error) return { error: describeDbError(error.message) };
    return { data };
}

export async function saveRouterCredentials(
    unitId: string,
    input: Omit<RouterCredentials, "updated_at">,
): Promise<{ error?: string; data?: RouterCredentials }> {
    const ctx = await requireSuperAdmin();
    if ("error" in ctx) return { error: ctx.error };

    const { data, error } = await ctx.admin
        .from("unit_router_credentials")
        .upsert({
            unit_id: unitId,
            router_username: clean(input.router_username),
            router_password: clean(input.router_password),
            gomo_email: clean(input.gomo_email),
            gomo_password: clean(input.gomo_password),
            updated_at: new Date().toISOString(),
            updated_by: ctx.user.id,
        })
        .select("router_username, router_password, gomo_email, gomo_password, updated_at")
        .single();

    if (error) return { error: describeDbError(error.message) };
    return { data };
}
