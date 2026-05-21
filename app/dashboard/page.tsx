import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic'
import { Suspense } from "react";
import { getFunders } from "@/helper/funders";
import { getAccounts } from "@/helper/accounts";
import { getUnits } from "@/helper/units";
import { Users, Building2, Server, Activity, Plus, DollarSign, Wallet, TrendingUp, CreditCard, BarChart, Percent, CheckCircle, Package, Stethoscope, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

import { InviteUserButton } from "@/components/page/InviteUserButton";
import { FranchiseEarningsChart, PhaseDistributionChart } from "../../components/DashboardCharts";

async function UserCheck() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const role = user.app_metadata?.role;

  const [
    funders, 
    accounts, 
    units, 
    { data: tradingAccounts }, 
    { data: packages }, 
    { data: payouts },
    { data: funderAccounts },
    { data: pairedAccounts },
    { data: franchises }
  ] = await Promise.all([
    getFunders(),
    getAccounts(),
    getUnits(),
    supabase.from('trading_accounts').select('id, live_equity, total_pnl, daily_pnl, funder_account_id'),
    supabase.from('package').select('id, balance, phase, purchase_price, account_id'),
    supabase.from('payouts').select('amount, status'),
    supabase.from('funder_account').select('id, package_id, status'),
    supabase.from('paired_trading_accounts').select('primary_starting_balance, primary_final_balance'),
    supabase.from('franchise').select('id, name')
  ]);

  // --- OPTIMIZED SINGLE-PASS AGGREGATIONS ---
  let totalPackageBalance = 0, totalCost = 0;
  let phase1Count = 0, phase2Count = 0, liveCount = 0;
  
  packages?.forEach(p => {
    totalPackageBalance += Number(p.balance || 0);
    totalCost += Number(p.purchase_price || 0);
    if (p.phase === 'phase 1') phase1Count++;
    else if (p.phase === 'phase 2') phase2Count++;
    else if (p.phase === 'live') liveCount++;
  });

  let totalLiveEquity = 0, totalPnl = 0, dailyPnl = 0;
  tradingAccounts?.forEach(ta => {
    totalLiveEquity += Number(ta.live_equity || 0);
    totalPnl += Number(ta.total_pnl || 0);
    dailyPnl += Number(ta.daily_pnl || 0);
  });

  let totalStartBal = 0, totalFinalBal = 0;
  pairedAccounts?.forEach(pa => {
    totalStartBal += Number(pa.primary_starting_balance || 0);
    totalFinalBal += Number(pa.primary_final_balance || 0);
  });

  let totalPayouts = 0;
  payouts?.forEach(p => {
    if (p.status === 'completed' || p.status === 'approved' || p.status === 'done') {
      totalPayouts += Number(p.amount || 0);
    }
  });

  let forPayoutCount = 0;
  funderAccounts?.forEach(fa => {
    if (fa.status === 'for payout') forPayoutCount++;
  });

  let activeUnits = 0;
  units.forEach(u => {
    if (u.status === 'enabled') activeUnits++;
  });
  const idleUnits = units.length - activeUnits;

  // Derived metrics
  const netProfitPaired = totalFinalBal - totalStartBal;
  const avgROI = totalStartBal > 0 ? ((totalFinalBal - totalStartBal) / totalStartBal) * 100 : 0;
  const totalPackages = packages?.length || 1;
  const passRate = (liveCount / totalPackages) * 100;

  // --- O(N) FAST RELATIONSHIP MAPPING ---
  // Connects trading_accounts -> funder_accounts -> packages -> accounts -> units -> franchises
  const unitToFranchise = new Map(units.map(u => [u.id, u.franchise_id]));
  const accountToFranchise = new Map(accounts.map(a => [a.id, unitToFranchise.get(a.unit_id)]));
  const packageToFranchise = new Map(packages?.map(p => [p.id, accountToFranchise.get(p.account_id)]) || []);
  const funderToFranchise = new Map(funderAccounts?.map(fa => [fa.id, packageToFranchise.get(fa.package_id)]) || []);

  const franchiseEarnings = new Map();
  tradingAccounts?.forEach(ta => {
    const franchiseId = funderToFranchise.get(ta.funder_account_id);
    if (franchiseId) {
      franchiseEarnings.set(franchiseId, (franchiseEarnings.get(franchiseId) || 0) + Number(ta.total_pnl || 0));
    }
  });

  const earningsByFranchise = franchises?.map(f => ({
    name: f.name || 'Unnamed',
    earnings: franchiseEarnings.get(f.id) || 0
  })).sort((a, b) => b.earnings - a.earnings) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const allStats = [
    { title: "Total Funders", value: funders.length, icon: Building2, color: "text-blue-500" },
    { title: "User Accounts", value: accounts.length, icon: Users, color: "text-purple-500" },
    { title: "Total PnL", value: formatCurrency(totalPnl), icon: TrendingUp, color: totalPnl >= 0 ? "text-emerald-500" : "text-red-500" },
    { title: "Daily PnL", value: formatCurrency(dailyPnl), icon: Activity, color: dailyPnl >= 0 ? "text-emerald-500" : "text-red-500" },
    { title: "Net Profit", value: formatCurrency(netProfitPaired), icon: Wallet, color: netProfitPaired >= 0 ? "text-emerald-500" : "text-red-500" },
    { title: "Total Payouts", value: formatCurrency(totalPayouts), icon: CreditCard, color: "text-purple-400" },
    { title: "Capital Deployed", value: formatCurrency(totalPackageBalance), icon: Wallet, color: "text-blue-400" },
    { title: "Global ROI", value: `${avgROI.toFixed(2)}%`, icon: Percent, color: avgROI >= 0 ? "text-emerald-500" : "text-red-500" },
    { title: "Cost / Earnings", value: `${formatCurrency(totalCost)} / ${formatCurrency(totalPnl)}`, icon: BarChart, color: "text-purple-400" },
    { title: "Ready Payouts", value: forPayoutCount, icon: CreditCard, color: "text-pink-400" },
    { title: "Phases (1/2)", value: `${phase1Count}/${phase2Count}`, icon: Activity, color: "text-orange-400" },
    { title: "Live Accounts", value: liveCount, icon: CheckCircle, color: "text-emerald-400" },
    { title: "Pass Rate", value: `${passRate.toFixed(1)}%`, icon: Percent, color: "text-blue-400" },
  ];

  return (
    <div className="p-4 lg:h-[100dvh] lg:overflow-hidden flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Welcome back! Authenticated as {user.email}</p>
        </div>
        {role === 'super-admin' && (
          <div className="flex shrink-0">
            <InviteUserButton />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 shrink-0">
        {allStats.map((stat, index) => (
          <div key={index} className="p-3 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-sm hover:border-gray-500/30 transition-all flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color} shrink-0`} />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">{stat.title}</p>
            </div>
            <h2 className={`text-lg font-bold ${stat.value.toString().includes('-') ? 'text-red-500' : 'text-white'} truncate`}>{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow min-h-0">
        
        <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-lg flex flex-col h-full">
          <h3 className="text-sm font-semibold text-white mb-2 shrink-0">Earnings per Franchise</h3>
          <div className="flex-grow min-h-0 relative">
            <div className="absolute inset-0">
              <FranchiseEarningsChart data={earningsByFranchise} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
          <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-lg flex flex-col flex-grow min-h-0">
            <h3 className="text-sm font-semibold text-white mb-2 shrink-0">Accounts Distribution</h3>
            <div className="flex-grow min-h-0 relative">
              <div className="absolute inset-0">
                <PhaseDistributionChart data={[
                  { name: 'Phase 1', value: phase1Count, color: '#f97316' },
                  { name: 'Phase 2', value: phase2Count, color: '#eab308' },
                  { name: 'Live', value: liveCount, color: '#10b981' }
                ]} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-lg shrink-0 flex justify-around items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{activeUnits}</div>
              <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Active Units</div>
            </div>
            <div className="w-px h-8 bg-[#333]"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">{idleUnits}</div>
              <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Idle Units</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
          <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-lg shrink-0">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button className="h-9 bg-[#0d0d0d] border border-[#1a1a1a] hover:bg-[#141414] text-white text-xs justify-start px-3 w-full" variant="outline">
                <Plus className="h-3.5 w-3.5 text-blue-500 mr-2" /> Funder
              </Button>
              <Button className="h-9 bg-[#0d0d0d] border border-[#1a1a1a] hover:bg-[#141414] text-white text-xs justify-start px-3 w-full" variant="outline">
                <Users className="h-3.5 w-3.5 text-purple-500 mr-2" /> Accounts
              </Button>
              <Button className="h-9 bg-[#0d0d0d] border border-[#1a1a1a] hover:bg-[#141414] text-white text-xs justify-start px-3 w-full" variant="outline">
                <Server className="h-3.5 w-3.5 text-orange-500 mr-2" /> Servers
              </Button>
              <Button className="h-9 bg-[#0d0d0d] border border-[#1a1a1a] hover:bg-[#141414] text-white text-xs justify-start px-3 w-full" variant="outline">
                <Activity className="h-3.5 w-3.5 text-green-500 mr-2" /> Trading
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-lg flex-grow flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-white mb-3 shrink-0">Recent Activity</h3>
            <div className="space-y-4 overflow-y-auto flex-grow pr-2">
              <div className="flex gap-3 items-start">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-white">System initialized</p>
                  <p className="text-[11px] text-muted-foreground">Welcome to Harmony AI Trading Platform</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-white">Ready to start trading</p>
                  <p className="text-[11px] text-muted-foreground">Add funders and accounts to begin</p>
                </div>
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