"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Package,
  CreditCard,
  Users,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
      // { title: "Payout", href: "/dashboard/trade/payout" }, // Hidden - can be restored in the future
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
  const [openItems, setOpenItems] = useState<string[]>(["Funders"]); // Funders is expanded by default

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  return (
    <aside className="fixed top-16 left-0 w-64 bg-gray-800 border-r border-gray-700 h-[calc(100vh-4rem)] overflow-y-auto">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const isOpen = openItems.includes(item.title);
          const hasChildren = item.children && item.children.length > 0;
          const isActive = pathname === item.href;
          const isChildActive = item.children?.some(
            (child) => pathname === child.href
          );

          if (hasChildren) {
            return (
              <Collapsible
                key={item.title}
                open={isOpen}
                onOpenChange={() => toggleItem(item.title)}
              >
                <CollapsibleTrigger
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    "text-white hover:bg-gray-700",
                    isChildActive && "bg-gray-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 mt-1 space-y-1">
                  {item.children?.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-3 py-2 text-sm rounded-md transition-colors",
                          "text-gray-300 hover:bg-gray-700 hover:text-white",
                          isChildActive &&
                          "bg-blue-600 text-white font-medium"
                        )}
                      >
                        {child.title}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <Link
              key={item.title}
              href={item.href || "#"}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                "text-white hover:bg-gray-700",
                isActive && "bg-gray-700"
              )}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}