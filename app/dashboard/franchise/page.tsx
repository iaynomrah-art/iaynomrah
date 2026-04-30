import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Store, Building2, Users, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFranchises } from "@/helper/franchise";
import { CopyOwnerId } from "@/components/franchise/CopyOwnerId";
export default async function FranchisePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== 'super-admin') {
    redirect("/dashboard");
  }

  const franchises = await getFranchises();

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Store className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Franchise Management</h1>
        </div>
        <p className="text-gray-400 text-sm font-medium ml-1">
          Monitor and manage your franchise network across all regions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#0a0a0a] border-[#1a1a1a] hover:border-blue-500/30 transition-all group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Franchises</CardTitle>
            <Building2 className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">12</div>
            <p className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              +2 this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0a0a] border-[#1a1a1a] hover:border-purple-500/30 transition-all group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Agents</CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">48</div>
            <p className="text-[10px] text-purple-400 font-bold flex items-center gap-1 mt-1">
              Across 4 regions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0a0a] border-[#1a1a1a] hover:border-orange-500/30 transition-all group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-widest">Revenue Share</CardTitle>
            <div className="text-orange-500 text-xs font-black">%</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">15.4%</div>
            <p className="text-[10px] text-orange-400 font-bold flex items-center gap-1 mt-1">
              Average performance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
        <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent">
          <h2 className="text-lg font-bold text-white">Franchise Directory</h2>
        </div>
        {franchises.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center border border-[#1a1a1a]">
              <Store className="w-8 h-8 text-gray-600" />
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">No franchises found</p>
              <p className="text-gray-500 text-sm max-w-[200px]">Start by adding your first franchise location to the platform.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-[#111] border-b border-[#1a1a1a]">
                <tr>
                  <th scope="col" className="w-10 px-0 py-4"></th>
                  <th scope="col" className="px-6 py-4 font-medium">Name</th>
                  <th scope="col" className="px-6 py-4 font-medium">Code</th>
                  <th scope="col" className="px-6 py-4 font-medium">Investor</th>
                  <th scope="col" className="px-6 py-4 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {franchises.map((franchise: any) => (
                  <tr key={franchise.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="w-10 px-2 py-4 text-center">
                      {franchise.owner_id && (
                        <CopyOwnerId ownerId={franchise.owner_id} />
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#111] border border-[#1a1a1a] flex items-center justify-center">
                        <Store className="w-4 h-4 text-gray-400" />
                      </div>
                      {franchise.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {franchise.code ? (
                        <span className="px-2 py-1 rounded bg-[#111] border border-[#1a1a1a] text-xs font-mono">
                          {franchise.code}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {franchise.investor_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {franchise.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
