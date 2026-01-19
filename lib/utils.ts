import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";




export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const presets = [
        { color: "#1c64f2", name: "Blue" },
        { color: "#E42338", name: "Red" },
        { color: "#FCBC11", name: "Yellow" },
        { color: "#10b981", name: "Green" },
        { color: "#8b5cf6", name: "Purple" },
        { color: "#f97316", name: "Orange" },
        { color: "#ec4899", name: "Pink" },
        { color: "#06b6d4", name: "Cyan" },
    ]

export const getFranchiseStyles = (code: string) => {
    switch (code?.toUpperCase()) {
        case 'MJ':
            return {
                accentColor: "border-l-purple-500",
                badgeBg: "bg-purple-500/10",
                badgeText: "text-purple-400"
            };
        case 'VP':
            return {
                accentColor: "border-l-teal-500",
                badgeBg: "bg-teal-500/10",
                badgeText: "text-teal-400"
            };
        default:
            return {
                accentColor: "border-l-blue-500",
                badgeBg: "bg-blue-500/10",
                badgeText: "text-blue-400"
            };
    }
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;


export const tabs = [
    { id: 'trading-accounts', label: 'Trading Accounts' },
    { id: 'paired-accounts', label: 'Paired Accounts' },
    { id: 'ongoing-trades', label: 'Ongoing Trades' },

]