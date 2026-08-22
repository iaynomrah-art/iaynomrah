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
import { Trash2, AlertTriangle } from "lucide-react"
import { DeleteAccountModal } from "@/components/modal/Delete/DeleteAccount"
import { deleteAccount } from "@/helper/accounts"
import { toast } from "sonner"
import Link from "next/link"
import { EditUserAccountDialog } from "@/components/modal/Edit/EditUserAccountDialog"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, Phone, ShieldCheck } from "lucide-react"
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
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-[100px] text-muted-foreground font-medium text-sm py-4">ACTIONS</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap py-4">USER</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap py-4">SERVER UNIT</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap py-4">CONTACT & ADDRESS</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-sm whitespace-nowrap py-4">VERIFICATION</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                No accounts found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((account) => (
                            <TableRow key={account.id} className={`border-[#1a1a1a] transition-colors ${account.flagged ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-[#111]'}`}>
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
                                <TableCell className="py-5">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar Initials */}
                                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-blue-400">
                                                {(account.first_name?.[0] || "") + (account.last_name?.[0] || "") || "U"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-white">
                                                    {[account.first_name, account.middle_name, account.last_name].filter(Boolean).join(" ")}
                                                </span>
                                                {account.flagged && (
                                                <span 
                                                    title={account.flagged_note || "Flagged for violations"}
                                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm flex items-center gap-1"
                                                >
                                                    <AlertTriangle className="w-3 h-3" />
                                                    FLAGGED
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[12px] text-muted-foreground tracking-wide flex items-center gap-1.5">
                                            <User className="w-3 h-3 opacity-50" />
                                            {account.email}
                                        </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-5">
                                    <div className="bg-[#1a1a1a]/80 px-3 py-1.5 rounded-md border border-[#2a2a2a] inline-flex items-center shadow-sm">
                                        <span className="text-xs text-white/90 font-semibold uppercase tracking-wider">
                                            {account.units?.unit_name || "UNASSIGNED"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-5">
                                    <div className="flex flex-col gap-1.5 max-w-[280px]">
                                        <div className="flex items-center gap-2 text-[13px] text-white/90">
                                            <Phone className="w-3.5 h-3.5 opacity-50 text-blue-400" />
                                            <span>{account.contact_number || "-"}</span>
                                            {account.contact_number_2 && (
                                                <span className="text-muted-foreground text-xs border-l border-[#333] pl-2 ml-1">
                                                    {account.contact_number_2}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5 opacity-50 mt-0.5 shrink-0" />
                                            <span className="truncate leading-relaxed" title={[account.address, account.city, account.province, account.zip_code].filter(Boolean).join(", ")}>
                                                {[account.address, account.city, account.province, account.zip_code].filter(Boolean).join(", ") || "No address provided"}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-5">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[13px] font-medium text-white/90">{account.id_type || "No ID"}</span>
                                        </div>
                                        <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold bg-[#1a1a1a] px-2 py-0.5 rounded inline-flex w-fit">
                                            {account.billing || "No Billing"}
                                        </span>
                                    </div>
                                </TableCell>
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


