import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalSession } from "@/lib/portal/session";
import { OwnerPortal } from "@/components/page/OwnerPortal";
import type { PortalAccount, PortalOwner, PortalPayout, PortalTrade } from "@/types/portal";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
    const session = await getPortalSession();
    if (!session) {
        redirect("/portal/login");
    }

    const admin = createAdminClient();
    if (!admin) {
        redirect("/portal/login");
    }

    // The portal_* functions only return this owner's own, owner-safe data, and
    // only the server (service role) can call them.
    const args = { p_account_id: session.accountId };
    const [me, accounts, trades, payouts] = await Promise.all([
        admin.rpc("portal_me", args),
        admin.rpc("portal_my_accounts", args),
        admin.rpc("portal_my_trades", args),
        admin.rpc("portal_my_payouts", args),
    ]);

    const loadError = [me, accounts, trades, payouts].find((r) => r.error)?.error;
    if (loadError) {
        console.error("Owner portal load error:", loadError);
    }

    const owner = (me.data as PortalOwner[] | null)?.[0] ?? null;

    return (
        <OwnerPortal
            owner={owner}
            email={owner?.email ?? ""}
            accounts={(accounts.data as PortalAccount[] | null) ?? []}
            trades={(trades.data as PortalTrade[] | null) ?? []}
            payouts={(payouts.data as PortalPayout[] | null) ?? []}
            loadFailed={Boolean(loadError)}
        />
    );
}
