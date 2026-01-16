
import { Skeleton } from "@/components/ui/skeleton";

export const UnitSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-[400px] rounded-lg bg-gray-800 animate-pulse border-border/50 border overflow-hidden">
                <div className="p-6 space-y-4">
                    <div className="flex justify-end">
                        <Skeleton className="h-6 w-12 bg-gray-700" />
                    </div>
                    <div className="flex justify-center flex-col items-center space-y-2">
                        <Skeleton className="h-4 w-12 bg-gray-700" />
                        <Skeleton className="h-8 w-24 bg-gray-700" />
                        <Skeleton className="h-4 w-20 bg-gray-700" />
                    </div>
                    <div className="space-y-2 pt-4">
                        <Skeleton className="h-10 w-full bg-gray-700" />
                        <Skeleton className="h-10 w-full bg-gray-700" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);