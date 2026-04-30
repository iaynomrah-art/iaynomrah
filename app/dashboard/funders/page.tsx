import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getFunders } from "@/helper/funders";
import FundersClient from "./FundersClient";

export default async function FundersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/dashboard");
    }

    const isSuperAdmin = user.app_metadata?.role === 'super-admin';
    const funders = await getFunders();

    return <FundersClient initialFunders={funders} isSuperAdmin={isSuperAdmin} />;
}