import React from 'react'

export const PairedTableSkeleton = () => {
    return (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="border border-[#1a1a1a] rounded-xl overflow-hidden bg-[#0a0a0a]">
                    {/* Header Skeleton */}
                    <div className="h-[72px] bg-[#0a0a0a] flex items-center justify-between px-6 border-b border-[#2b3139]">
                        <div className="flex items-center gap-6">
                            <div className="h-6 w-6 bg-[#1a1a1a] rounded" />
                            <div className="flex gap-8">
                                <div className="h-5 w-40 bg-[#1a1a1a] rounded" />
                                <div className="h-5 w-40 bg-[#1a1a1a] rounded" />
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="h-6 w-16 bg-[#1a1a1a] rounded" />
                            <div className="h-8 w-8 bg-[#1a1a1a] rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
