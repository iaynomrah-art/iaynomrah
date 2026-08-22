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
import { Pencil, Trash2, Filter } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DeleteFunderAccountModal } from "@/components/modal/Delete/DeleteFunderAccount"
import { deleteFunderAccount } from "@/helper/funder_accounts"
import { toast } from "sonner"
import Link from "next/link"
import { EditFunderAccountDialog } from "@/components/modal/Edit/EditFunderAccountDialog"
import { AccountStatusColors, cn } from "@/lib/utils"
import { AccountStatus, FunderAccount } from "@/types/funder_accounts"
import { Package } from "@/types/package"
import { Account } from "@/types/accounts"
import { Unit } from "@/types/units"
import { Funder } from "@/types/funder"

interface FunderAccountsTableProps {
    data: FunderAccount[];
    franchises?: any[];
}

export const FunderAccountsTable = ({
    data,
    franchises
}: FunderAccountsTableProps) => {
    const [selectedFunderAccount, setSelectedFunderAccount] = useState<{ id: string, name: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hideBurned, setHideBurned] = useState(true); // By default, hide burned
    const [selectedFunders, setSelectedFunders] = useState<string[]>([]);
    const [selectedFranchises, setSelectedFranchises] = useState<string[]>([]);

    const uniqueFunders = Array.from(new Set(data.map(item => item.package?.funders?.allias || item.package?.funders?.name).filter(Boolean))) as string[];
    const uniqueFranchises = franchises 
        ? franchises.map(f => f.name).sort() 
        : Array.from(new Set(data.map(item => (item.package?.account?.units as any)?.franchise?.name).filter(Boolean))).sort() as string[];

    const filteredData = data.filter(item => {
        const isBurned = (item.status as string) === 'burned';
        if (hideBurned && isBurned) return false;

        const funderName = item.package?.funders?.allias || item.package?.funders?.name || "";
        const matchesFunder = selectedFunders.length === 0 || selectedFunders.includes(funderName);
        
        const franchiseName = (item.package?.account?.units as any)?.franchise?.name || "";
        const matchesFranchise = selectedFranchises.length === 0 || selectedFranchises.includes(franchiseName);

        return matchesFunder && matchesFranchise;
    });

    const activeFilterCount = selectedFunders.length + selectedFranchises.length + (!hideBurned ? 1 : 0);

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
            <div className="flex items-center gap-2 mb-6 border-b border-[#1a1a1a] pb-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 bg-[#0d0d0d] border-[#1a1a1a] text-gray-300 hover:bg-[#111] hover:text-white transition-all">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-[#0d0d0d] border-[#1a1a1a] text-gray-300">
                        <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                        <DropdownMenuCheckboxItem
                            checked={!hideBurned}
                            onCheckedChange={(checked) => setHideBurned(!checked)}
                            onSelect={(e) => e.preventDefault()}
                            className="focus:bg-[#1a1a1a] focus:text-white"
                        >
                            Show Burned Accounts
                        </DropdownMenuCheckboxItem>
                        
                        {uniqueFranchises.length > 0 && (
                            <>
                                <DropdownMenuSeparator className="bg-[#1a1a1a]" />
                                <DropdownMenuLabel>Franchises</DropdownMenuLabel>
                                {uniqueFranchises.map((f) => (
                                    <DropdownMenuCheckboxItem
                                        key={f}
                                        checked={selectedFranchises.includes(f)}
                                        onCheckedChange={(checked) => {
                                            setSelectedFranchises(prev => 
                                                checked ? [...prev, f] : prev.filter(x => x !== f)
                                            );
                                        }}
                                        onSelect={(e) => e.preventDefault()}
                                        className="focus:bg-[#1a1a1a] focus:text-white"
                                    >
                                        {f}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </>
                        )}

                        {uniqueFunders.length > 0 && (
                            <>
                                <DropdownMenuSeparator className="bg-[#1a1a1a]" />
                                <DropdownMenuLabel>Funders</DropdownMenuLabel>
                                {uniqueFunders.map((f) => (
                                    <DropdownMenuCheckboxItem
                                        key={f}
                                        checked={selectedFunders.includes(f)}
                                        onCheckedChange={(checked) => {
                                            setSelectedFunders(prev => 
                                                checked ? [...prev, f] : prev.filter(x => x !== f)
                                            );
                                        }}
                                        onSelect={(e) => e.preventDefault()}
                                        className="focus:bg-[#1a1a1a] focus:text-white"
                                    >
                                        {f}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">UNIT</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">USER</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">CREDENTIAL</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">PACKAGE</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">FUNDER</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">STATUS</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">DATE</TableHead>
                        <TableHead className="w-1/10 text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                {hideBurned ? "No active funder accounts found." : "No funder accounts found matching the selected filters."}
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredData.map((item) => (
                            <TableRow 
                                key={item.id} 
                                className={cn(
                                    "border-[#1a1a1a] transition-colors",
                                    (item.status as string) === 'burned' ? "bg-red-950/20 hover:bg-red-950/30" : "hover:bg-[#111]"
                                )}
                            >
                                <TableCell className="text-white py-4 text-sm font-medium">
                                    {item.package?.account?.units?.unit_name || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {item.package?.account ? `${item.package.account.first_name} ${item.package.account.last_name}`.trim() : "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {item.package?.credential ? `${item.package.credential.username}${item.package.credential.platform_id ? ` - ${item.package.credential.platform_id}` : ''}` : "-"}
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
                                    {(item.status as string) === 'burned' ? (
                                        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold w-fit border whitespace-nowrap bg-red-500/10 text-red-500 border-red-500/20 flex items-center gap-1">
                                            🔥 BURNED
                                        </div>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            style={{
                                                backgroundColor: `${AccountStatusColors[item.status] || '#888'}15`,
                                                color: AccountStatusColors[item.status] || '#888',
                                                borderColor: `${AccountStatusColors[item.status] || '#888'}30`,
                                            }}
                                            className="font-bold px-3 py-1 text-[10px] uppercase tracking-wider"
                                        >
                                            {item.status}
                                        </Badge>
                                    )}
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


