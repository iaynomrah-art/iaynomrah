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
import { EditFunderAccountDialog } from "@/components/modal/Edit/EditFunderAccountDialog"
import { AccountStatusColors } from "@/lib/utils"
import { AccountStatus, FunderAccount } from "@/types/funder_accounts"
import { Package } from "@/types/package"
import { Account } from "@/types/accounts"
import { Unit } from "@/types/units"
import { Funder } from "@/types/funder"

interface FunderAccountsTableProps {
    data: FunderAccount[]
}

export const FunderAccountsTable = ({
    data
}: FunderAccountsTableProps) => {
    const [selectedFunderAccount, setSelectedFunderAccount] = useState<{ id: string, name: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: string, firstName?: string | null, lastName?: string | null) => {
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
                                    {item.package?.account?.units?.unit_name || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {item.package?.account ? `${item.package.account.first_name} ${item.package.account.last_name}`.trim() : "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {item.package?.account?.id || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {item.package?.name || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {item.package?.funders ? (
                                        <span
                                            className="px-2 py-1 rounded text-xs font-bold"
                                            style={{
                                                backgroundColor: item.package.funders.allias_color || "#1c64f2",
                                                color: item.package.funders.text_color || "white"
                                            }}
                                        >
                                            {item.package.funders.allias || item.package.funders.name}
                                        </span>
                                    ) : (
                                        "-"
                                    )}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm capitalize w-fit">
                                    <Badge
                                        variant="outline"
                                        style={{
                                            backgroundColor: `${AccountStatusColors[item.status]}15`,
                                            color: AccountStatusColors[item.status],
                                            borderColor: `${AccountStatusColors[item.status]}30`,
                                        }}
                                        className="font-bold px-3 py-1 text-[10px] uppercase tracking-wider"
                                    >
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <EditFunderAccountDialog
                                            funderAccount={item}
                                        />

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-red-500 transition-colors"
                                            onClick={() => handleDeleteClick(item.id, item.package?.account?.first_name, item.package?.account?.last_name)}
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


