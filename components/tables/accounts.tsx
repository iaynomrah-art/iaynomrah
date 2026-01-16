import React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Account {
    id: number
    first_name: string
    middle_name: string
    last_name: string
    email: string
    address: string
    contact_number: string
    contact_number_2: string
    id_type: string
    billing: string
    server_unit?: string
    [key: string]: any
}

interface AccountsTableProps {
    data: Account[]
}

export const AccountsTable = ({ data }: AccountsTableProps) => {
    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-[100px] text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">SERVER UNIT</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">FIRST NAME</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">MIDDLE NAME</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">LAST NAME</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">EMAIL</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">ADDRESS</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">CONTACT NUMBER 1</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">CONTACT NUMBER 2</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">ID TYPE</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">BILLING</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                                No accounts found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((account) => (
                            <TableRow key={account.id} className="border-[#1a1a1a] hover:bg-[#111] transition-colors">
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-white transition-colors">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-red-500 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-white py-4">{account.server_unit || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.first_name}</TableCell>
                                <TableCell className="text-white py-4">{account.middle_name || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.last_name}</TableCell>
                                <TableCell className="text-white py-4">{account.email}</TableCell>
                                <TableCell className="text-white py-4">{account.address + ", " + account.city + ", " + account.province + ", " + account.zip_code || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.contact_number || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.contact_number_2 || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.id_type || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.billing || "-"}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export const AccountsTableSkeleton = () => {
    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-[100px] text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">SERVER UNIT</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">FIRST NAME</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">MIDDLE NAME</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">LAST NAME</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">EMAIL</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">ADDRESS</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">CONTACT NUMBER 1</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">CONTACT NUMBER 2</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">ID TYPE</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">BILLING</TableHead>
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
                                <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[120px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[120px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[180px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[200px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[120px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[120px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
