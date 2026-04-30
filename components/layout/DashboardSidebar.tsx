"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Package,
  CreditCard,
  Users,
  ChevronRight,
  Store,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  children?: {
    title: string;
    href: string;
  }[];
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    title: "Trade",
    icon: <Server className="w-4 h-4" />,
    children: [
      { title: "Make Money", href: "/dashboard/trade/make-money" },
      { title: "Trade History", href: "/dashboard/trade/history" },
    ],
  },
  {
    title: "Server Units",
    icon: <Package className="w-4 h-4" />,
    children: [
      { title: "Server Units", href: "/dashboard/trading-units/my-units" },
    ],
  },
  {
    title: "Trading Accounts",
    icon: <CreditCard className="w-4 h-4" />,
    children: [
      { title: "Funder Accounts", href: "/dashboard/trading-accounts/funder-accounts" },
      { title: "Account Credentials", href: "/dashboard/trading-accounts/credentials" },
      { title: "User Accounts", href: "/dashboard/trading-accounts/user-accounts" },
    ],
  },
  {
    title: "Funders",
    icon: <Users className="w-4 h-4" />,
    children: [
      { title: "Funders", href: "/dashboard/funders" },
      { title: "Funders Packages", href: "/dashboard/funders/packages" },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const getRole = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user?.app_metadata?.role) {
        setRole(data.user.app_metadata.role);
      }
    };
    getRole();
  }, []);

  const displayMenuItems = [...menuItems];
  if (role === 'super-admin') {
    displayMenuItems.splice(1, 0, {
      title: "Franchise",
      href: "/dashboard/franchise",
      icon: <Store className="w-4 h-4" />,
    });
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-[#1a1a1a] bg-[#050505]">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-[#1a1a1a] bg-[#050505]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">H</span>
          </div>
          <span className="text-white font-bold text-lg group-data-[collapsible=icon]:hidden">Harmony AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#444] text-[10px] font-black uppercase tracking-widest px-4 mb-2 group-data-[collapsible=icon]:hidden">
            Main Menu
          </SidebarGroupLabel>
          <SidebarMenu>
            {displayMenuItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isActive = pathname === item.href;
              const isChildActive = item.children?.some(
                (child) => pathname === child.href
              );

              if (hasChildren) {
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isChildActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={cn(
                            "text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all duration-200 px-4 py-6",
                            isChildActive && "text-blue-400 bg-blue-400/5"
                          )}
                        >
                          {item.icon}
                          <span className="font-semibold text-xs tracking-tight group-data-[collapsible=icon]:hidden">{item.title}</span>
                          <ChevronRight className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="border-l border-[#1a1a1a] ml-4 my-1">
                          {item.children?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                <Link
                                  href={subItem.href}
                                  className={cn(
                                    "text-gray-400 hover:text-white transition-colors py-2.5 text-xs font-medium",
                                    pathname === subItem.href && "text-white font-bold"
                                  )}
                                >
                                  {subItem.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className={cn(
                      "text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all duration-200 px-4 py-6",
                      isActive && "text-blue-400 bg-blue-400/5 font-bold"
                    )}
                  >
                    <Link href={item.href || "#"}>
                      {item.icon}
                      <span className="font-semibold text-xs tracking-tight group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}