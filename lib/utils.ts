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

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;


