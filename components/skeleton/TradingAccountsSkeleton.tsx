"use client"

import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export const TradingAccountsTableSkeleton = () => {
    return (
        <div className="w-full overflow-hidden border border-[#1a1a1a] rounded-lg">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        {['ACCOUNT', 'STATUS', 'L-EQUITY', 'DAILY P&L', 'RDD', 'HIGHEST PROFIT', 'CONSIS', 'R.T-DAYS', 'R.T-PROFIT'].map((header) => (
                            <TableHead key={header} className="text-muted-foreground font-medium text-[10px] py-4 px-4">
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <TableRow key={i} className="border-[#1a1a1a] hover:bg-transparent">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                                <TableCell key={j} className="py-4 px-4">
                                    <Skeleton className="h-3 w-full bg-[#1a1a1a] opacity-50" />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export const TradingAccountsPageSkeleton = () => {
    return (
        <div className="animate-in fade-in duration-700 flex flex-col lg:flex-row gap-8 mt-4">
            {/* Sidebar Skeleton */}
            <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-20 bg-[#1a1a1a]" />
                        <Skeleton className="h-6 w-16 bg-[#1a1a1a] rounded-md" />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Availability */}
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-24 bg-[#1a1a1a]" />
                        <Skeleton className="h-10 w-full bg-[#0d0d0d] rounded-lg" />
                    </div>

                    {/* Funders Group */}
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-16 bg-[#1a1a1a]" />
                        <div className="grid grid-cols-1 gap-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-10 w-full bg-[#0d0d0d] rounded-lg" />
                            ))}
                        </div>
                    </div>

                    {/* Phases Group */}
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-16 bg-[#1a1a1a]" />
                        <div className="grid grid-cols-1 gap-1">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-8 w-full bg-[#0d0d0d] rounded-md" />
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Skeleton */}
            <div className="flex-1 min-w-0 space-y-6">
                <div className="flex items-center gap-4 h-14">
                    <Skeleton className="h-8 w-40 bg-blue-500/5 rounded-full" />
                    <Skeleton className="h-10 w-32 bg-blue-500/10 rounded-lg" />
                </div>
                <TradingAccountsTableSkeleton />
            </div>
        </div>
    )
}
