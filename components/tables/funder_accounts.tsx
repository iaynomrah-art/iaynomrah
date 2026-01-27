"use client"

import React, { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { DeleteFunderAccountModal } from "@/components/modal/Delete/DeleteFunderAccount"
import { deleteFunderAccount } from "@/helper/funder_accounts"
import { toast } from "sonner"
import Link from "next/link"

interface FunderAccount {
    id: number
    status: boolean
    created_at: string,
    units?: {
        unit_name: string
        [key: string]: any
    } | null
    accounts?: {
        id: number
        first_name: string
        last_name: string
        [key: string]: any
    } | null
    package?: {
        name: string
        [key: string]: any
    } | null
    [key: string]: any
}

interface FunderAccountsTableProps {
    data: FunderAccount[]
}

export const FunderAccountsTable = ({ data }: FunderAccountsTableProps) => {
    const [selectedFunderAccount, setSelectedFunderAccount] = useState<{ id: number, name: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: number, firstName?: string, lastName?: string) => {
        const name = firstName && lastName ? `${firstName} ${lastName}` : "this funder account";
        setSelectedFunderAccount({ id, name });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedFunderAccount) return;

        setIsDeleting(true);
        try {
            await deleteFunderAccount(selectedFunderAccount.id);
            toast.success("Funder account deleted successfully");
            setIsDeleteModalOpen(false);
            setSelectedFunderAccount(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete funder account");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">UNIT</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">NAME</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">ACCOUNT ID</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">PACKAGE</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">STATUS</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">DATE</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No funder accounts found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id} className="border-[#1a1a1a] hover:bg-[#111] transition-colors">
                                <TableCell className="text-white py-4 text-sm font-medium">
                                    {item.units?.unit_name || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {item.accounts ? `${item.accounts.first_name} ${item.accounts.last_name}`.trim() : "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {item.accounts?.id || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {item.package?.name || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm capitalize w-fit">
                                    <Badge
                                        className={item.status ? "bg-green-500 text-white" : "bg-red-500 text-white"}
                                    >
                                        {item.status ? "Active" : "Inactive"}
                                    </Badge>

                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/dashboard/trading-accounts/funder-accounts/add-funder-account?id=${item.id}`}
                                            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-[#262626] text-muted-foreground hover:text-white transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-red-500 transition-colors"
                                            onClick={() => handleDeleteClick(item.id, item.accounts?.first_name, item.accounts?.last_name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <DeleteFunderAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                accountName={selectedFunderAccount?.name || ""}
                isPending={isDeleting}
            />
        </div>
    )
}

export const FunderAccountsTableSkeleton = () => {
    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">UNIT</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">NAME</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">ACCOUNT ID</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">PACKAGE</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">STATUS</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">DATE</TableHead>
                        <TableHead className="w-1/7 text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
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
