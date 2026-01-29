"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"


export const FunderAccountsTableSkeleton = () => {
    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">UNIT</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">USER</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">ACCOUNT ID</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">PACKAGE</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">FUNDER</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">STATUS</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">DATE</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i} className="border-[#1a1a1a] hover:bg-transparent">
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[80px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[150px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[60px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[80px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md bg-[#1a1a1a]" />
                                    <Skeleton className="h-8 w-8 rounded-md bg-[#1a1a1a]" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}