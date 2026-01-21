import { cn } from "@/lib/utils";

export default function Row({ label, value, color }: { label: string, value: string, color?: string }) {
    return (
        <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
            <span className="text-[#848e9c] text-[13px] font-medium">{label}</span>
            <span className={cn("text-white text-[13px] font-bold text-right", color)}>{value}</span>
        </div>
    )
}