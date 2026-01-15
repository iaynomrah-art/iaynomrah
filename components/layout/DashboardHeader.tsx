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

import { clearAdditionalAuthCookie } from "@/lib/auth-actions";

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
    <header className="fixed top-0 left-0 right-0 z-10 w-full bg-[#1a1f2e] border-b border-gray-700 h-16">
      <div className="w-full h-full flex justify-between items-center px-6">
        {/* Left side - Brand */}
        <div className="text-white font-bold text-lg">Harmony AI</div>

        {/* Right side - Portfolio info and user menu */}
        <div className="flex items-center gap-4">
          {/* Philippine Portfolio text */}
          <span className="text-white font-bold">Philippine Portfolio</span>

          {/* AI Trade button */}
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
            AI Trade
          </button>

          {/* Philippine Flag Icon */}
          <div className="w-6 h-4 flex-shrink-0 relative">
            <svg
              viewBox="0 0 180 120"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Blue stripe */}
              <rect x="0" y="0" width="180" height="60" fill="#0038A8" />
              {/* Red stripe */}
              <rect x="0" y="60" width="180" height="60" fill="#CE1126" />
              {/* White triangle */}
              <polygon points="0,0 0,120 90,60" fill="#FFFFFF" />
              {/* Sun */}
              <circle cx="45" cy="60" r="12" fill="#FCD116" />
              {/* Eight rays */}
              {[...Array(8)].map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180;
                const x1 = 45 + Math.cos(angle) * 15;
                const y1 = 60 + Math.sin(angle) * 15;
                const x2 = 45 + Math.cos(angle) * 22;
                const y2 = 60 + Math.sin(angle) * 22;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#FCD116"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })}
              {/* Three stars */}
              <g fill="#FCD116">
                <polygon points="37.5,30 39,34 43,34 40,37 41,41 37.5,39 34,41 35,37 32,34 36,34" />
                <polygon points="37.5,82.5 39,86.5 43,86.5 40,89.5 41,93.5 37.5,91.5 34,93.5 35,89.5 32,86.5 36,86.5" />
                <polygon points="37.5,56.25 39,60.25 43,60.25 40,63.25 41,67.25 37.5,65.25 34,67.25 35,63.25 32,60.25 36,60.25" />
              </g>
            </svg>
          </div>

          {/* User dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 flex items-center justify-center text-white text-[10px] font-medium cursor-pointer transition-colors">
                <div className="flex flex-col items-center justify-center leading-[1.1] tracking-tight">
                  <span>AI</span>
                  <span>TRADE</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-gray-800 border-gray-700 text-white p-0">
              <DropdownMenuLabel className="px-3 py-2 text-sm font-medium text-white border-b border-gray-700">
                Welcome AI Trade / Philippine Portfolio
              </DropdownMenuLabel>
              <div className="px-3 py-2 text-sm text-gray-300 border-b border-gray-700">
                {userEmail}
              </div>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-white focus:bg-gray-700 focus:text-white px-3 py-2"
              >
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}