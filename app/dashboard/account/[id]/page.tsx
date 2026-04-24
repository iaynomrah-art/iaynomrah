import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AccountSettingsForm from "../../../../components/form/AccountSettingsForm";

export default async function AccountSettingsPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/auth/login");
    }

    // Prepare initial data from auth metadata
    const initialData = {
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        phone: user.user_metadata?.phone || "", // Optional phone from metadata
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <AccountSettingsForm initialData={initialData} />
            </div>
        </div>
    );
}
