import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { getFunders } from "@/helper/funders";
import { getAccounts } from "@/helper/accounts";
import { getUnits } from "@/helper/units";
import { Users, Building2, Server, Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { InviteUserButton } from "@/components/page/InviteUserButton";

async function UserCheck() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const role = user.app_metadata?.role;

  const [funders, accounts, units] = await Promise.all([
    getFunders(),
    getAccounts(),
    getUnits()
  ]);

  const stats = [
    { title: "Total Funders", value: funders.length, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "User Accounts", value: accounts.length, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Server Units", value: units.length, icon: Server, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "Active Units", value: units.filter(u => u.status === 'enabled').length, icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your trading platform.</p>
          <p className="text-xs text-muted-foreground mt-1">Successfully authenticated as {user.email}</p>
        </div>
        {role === 'super-admin' && (
          <div className="flex shrink-0">
            <InviteUserButton />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-6 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-lg hover:border-blue-500/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <h2 className="text-2xl font-bold text-white">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Quick Actions */}
        <div className="p-6 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-lg space-y-6">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            <Button
              className="h-12 bg-[#0d0d0d] border border-[#1a1a1a] hover:bg-[#141414] hover:border-blue-500/50 text-white flex items-center justify-start px-4 gap-4 transition-all w-full group/btn"
              variant="outline"
            >
              <Plus className="h-5 w-5 text-blue-500 group-hover/btn:scale-110 transition-transform" />
              <span className="text-sm font-medium">Add New Funder</span>
            </Button>
            <Button
              className="h-12 bg-[#0d0d0d] border border-[#1a1a1a] hover:bg-[#141414] hover:border-purple-500/50 text-white flex items-center justify-start px-4 gap-4 transition-all w-full group/btn"
              variant="outline"
            >
              <Users className="h-5 w-5 text-purple-500 group-hover/btn:scale-110 transition-transform" />
              <span className="text-sm font-medium">Manage User Accounts</span>
            </Button>
            <Button
              className="h-12 bg-[#0d0d0d] border border-[#1a1a1a] hover:bg-[#141414] hover:border-orange-500/50 text-white flex items-center justify-start px-4 gap-4 transition-all w-full group/btn"
              variant="outline"
            >
              <Server className="h-5 w-5 text-orange-500 group-hover/btn:scale-110 transition-transform" />
              <span className="text-sm font-medium">View Server Units</span>
            </Button>
            <Button
              className="h-12 bg-[#0d0d0d] border border-[#1a1a1a] hover:bg-[#141414] hover:border-green-500/50 text-white flex items-center justify-start px-4 gap-4 transition-all w-full group/btn"
              variant="outline"
            >
              <Activity className="h-5 w-5 text-green-500 group-hover/btn:scale-110 transition-transform" />
              <span className="text-sm font-medium">View Trading Accounts</span>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-lg space-y-6 h-full">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">System initialized</p>
                <p className="text-xs text-muted-foreground">Welcome to Harmony AI Trading Platform</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Ready to start trading</p>
                <p className="text-xs text-muted-foreground">Add funders and accounts to begin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
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