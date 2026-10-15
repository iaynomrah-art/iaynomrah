import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal/session";
import { PortalAuthForm } from "@/components/page/PortalAuthForm";

export const dynamic = "force-dynamic";

export default async function PortalLoginPage() {
    if (await getPortalSession()) {
        redirect("/portal");
    }
    return <PortalAuthForm />;
}
