import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export const AccountsTableSkeleton = () => {
    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-[100px] text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">USER</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">SERVER UNIT</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">CONTACT & ADDRESS</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">VERIFICATION</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i} className="border-[#1a1a1a] hover:bg-transparent">
                            <TableCell className="py-4">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md bg-[#1a1a1a]" />
                                    <Skeleton className="h-8 w-8 rounded-md bg-[#1a1a1a]" />
                                </div>
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className="h-4 w-[140px] bg-[#1a1a1a]" />
                                    <Skeleton className="h-3 w-[180px] bg-[#1a1a1a]" />
                                </div>
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-6 w-[80px] rounded-md bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className="h-4 w-[120px] bg-[#1a1a1a]" />
                                    <Skeleton className="h-3 w-[200px] bg-[#1a1a1a]" />
                                </div>
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                                    <Skeleton className="h-3 w-[80px] bg-[#1a1a1a]" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}