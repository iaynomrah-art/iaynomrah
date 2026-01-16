import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-[250px] bg-[#1a1a1a]" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-[#1a1a1a]" />
                <Skeleton className="h-4 w-[90%] bg-[#1a1a1a]" />
                <Skeleton className="h-4 w-[95%] bg-[#1a1a1a]" />
            </div>
            <div className="pt-6">
                <Skeleton className="h-[400px] w-full rounded-xl bg-[#1a1a1a]" />
            </div>
        </div>
    )
}
