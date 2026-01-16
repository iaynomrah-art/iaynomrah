import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function UserCheck() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Welcome to Harmony</h1>
      <p className="text-muted-foreground">Successfully authenticated as {user.email}</p>
    </div>
  );
}

const page = () => {
  return (
    <div suppressHydrationWarning className="min-h-full bg-[#050505]">
      <Suspense fallback={
        <div className="p-6 space-y-4">
          <div className="h-8 w-64 bg-[#1a1a1a] animate-pulse rounded" />
          <div className="h-4 w-96 bg-[#1a1a1a] animate-pulse rounded" />
        </div>
      }>
        <UserCheck />
      </Suspense>
    </div>
  )
}

export default page