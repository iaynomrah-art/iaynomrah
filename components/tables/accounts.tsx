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
import { Trash2 } from "lucide-react"
import { DeleteAccountModal } from "@/components/modal/Delete/DeleteAccount"
import { deleteAccount } from "@/helper/accounts"
import { toast } from "sonner"
import Link from "next/link"
import { EditUserAccountDialog } from "@/components/modal/Edit/EditUserAccountDialog"
export { AccountsTableSkeleton } from "@/components/skeleton/AccountTableSkeleton"

interface Account {
    id: string
    first_name: string
    middle_name: string
    last_name: string
    email: string
    address: string
    contact_number: string
    contact_number_2: string
    id_type: string
    billing: string
    units?: { unit_name: string } | null
    [key: string]: any
}

interface AccountsTableProps {
    data: Account[]
    units?: any[]
    setAccounts: React.Dispatch<React.SetStateAction<any[]>>
}

export const AccountsTable = ({ data, units = [], setAccounts }: AccountsTableProps) => {
    const [selectedAccount, setSelectedAccount] = useState<{ id: string, name: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: string, firstName: string, lastName: string) => {
        setSelectedAccount({ id, name: `${firstName} ${lastName}` });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedAccount) return;

        const accountToDelete = selectedAccount;
        const previousAccounts = [...data];

        setIsDeleting(true);
        // Optimistic update
        setAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id));

        try {
            await deleteAccount(accountToDelete.id);
            toast.success("Account deleted successfully");
            setIsDeleteModalOpen(false);
            setSelectedAccount(null);
        } catch (error: any) {
            // Rollback
            setAccounts(previousAccounts);
            toast.error(error.message || "Failed to delete account");
        } finally {
            setIsDeleting(false);
        }
    };
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
                                        <EditUserAccountDialog account={account} units={units} setAccounts={setAccounts} />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-red-500 transition-colors"
                                            onClick={() => handleDeleteClick(account.id, account.first_name, account.last_name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-white py-4">{account.units?.unit_name || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.first_name}</TableCell>
                                <TableCell className="text-white py-4">{account.middle_name || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.last_name}</TableCell>
                                <TableCell className="text-white py-4">{account.email}</TableCell>
                                <TableCell className="text-white py-4">
                                    {[account.address, account.city, account.province, account.zip_code]
                                        .filter(Boolean)
                                        .join(", ") || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4">{account.contact_number || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.contact_number_2 || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.id_type || "-"}</TableCell>
                                <TableCell className="text-white py-4">{account.billing || "-"}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                accountName={selectedAccount?.name || ""}
                isPending={isDeleting}
            />
        </div>
    )
}


