"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { clearAdditionalAuthCookie } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { User, LogOut, Settings, Bell, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("admin_aitrade@disruptorai.com");

  useEffect(() => {
    const getUserEmail = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    };
    getUserEmail();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await Promise.all([
      supabase.auth.signOut(),
      clearAdditionalAuthCookie(),
    ]);
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 w-full">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all" />

        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[11px] font-black uppercase tracking-wider">Philippine Portfolio</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Actions Group */}
        <div className="flex items-center gap-1 border-r border-[#1a1a1a] pr-2 lg:pr-4 mr-1 lg:mr-2">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1a1a] h-9 w-9">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1a1a] h-9 w-9">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-1 rounded-full hover:bg-[#1a1a1a] transition-all outline-none group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white text-[11px] font-black leading-none">AI</span>
              </div>
              <div className="hidden lg:flex flex-col items-start leading-none pr-2">
                <span className="text-white text-xs font-bold mb-1">Harmony Master</span>
                <span className="text-gray-500 text-[9px] font-medium tracking-tight">System Admin</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-[#0d0d0d] border-[#1a1a1a] text-white p-2 mt-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <DropdownMenuLabel className="px-3 py-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-white">Active Session</p>
                <p className="text-[10px] text-gray-400 font-medium truncate">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#1a1a1a]" />

            <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:text-white focus:bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer group">
              <User className="w-4 h-4 group-hover:text-blue-400" />
              <span className="font-medium">Account Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:text-white focus:bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer group">
              <Settings className="w-4 h-4 group-hover:text-blue-400" />
              <span className="font-medium">System Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[#1a1a1a]" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 text-sm text-red-400 hover:text-red-300 focus:bg-red-400/10 rounded-lg transition-colors cursor-pointer group"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-bold">Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}