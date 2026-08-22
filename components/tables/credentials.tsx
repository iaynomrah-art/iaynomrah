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
import { Pencil, Trash2, Copy, Check, Filter } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { DeleteCredentialModal } from "@/components/modal/Delete/DeleteCredential"
import { deleteCredential } from "@/helper/credentials"
import Link from "next/link"
import { EditCredentialDialog } from "@/components/modal/Edit/EditCredentialDialog"
import { Credential } from "@/types/credentials"
import { cn } from "@/lib/utils"


interface CredentialsTableProps {
    data: Credential[]
    franchises?: any[]
}

export const CredentialsTable = ({ data, franchises = [] }: CredentialsTableProps) => {
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [selectedCredential, setSelectedCredential] = useState<{ id: string, name: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hideBurned, setHideBurned] = useState(true);
    const [selectedFranchises, setSelectedFranchises] = useState<string[]>([]);

    const isCredentialBurned = (credential: Credential) => {
        return credential.package?.some((pkg: any) => 
            pkg.funder_account?.some((fa: any) => fa.status === 'burned')
        ) || false;
    };

    const getFranchiseName = (credential: Credential) => {
        const acc = credential.accounts;
        if (acc) {
            const account = Array.isArray(acc) ? acc[0] : acc;
            if ((account as any)?.units?.franchise?.name) {
                return (account as any).units.franchise.name;
            }
        }
        const pkg = credential.package?.[0];
        if (pkg) {
            const pkgAccounts = pkg.accounts;
            const pkgAcc = Array.isArray(pkgAccounts) ? pkgAccounts[0] : pkgAccounts;
            if ((pkgAcc as any)?.units?.franchise?.name) {
                return (pkgAcc as any).units.franchise.name;
            }
        }
        return "";
    };

    const uniqueFranchises = franchises && franchises.length > 0 
        ? franchises.map(f => f.name).sort() 
        : Array.from(new Set(data.map(item => getFranchiseName(item)).filter(Boolean))).sort() as string[];

    const filteredData = data.filter(credential => {
        const burned = isCredentialBurned(credential);
        if (hideBurned && burned) return false;

        const franchiseName = getFranchiseName(credential);
        const matchesFranchise = selectedFranchises.length === 0 || selectedFranchises.includes(franchiseName);

        return matchesFranchise;
    });

    const activeFilterCount = selectedFranchises.length + (!hideBurned ? 1 : 0);

    const handleCopy = async (password: string, id: string) => {
        try {
            await navigator.clipboard.writeText(password)
            setCopiedId(id)
            toast.success("Password copied to clipboard")
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            toast.error("Failed to copy password")
        }
    }

    const handleDeleteClick = (id: string, name: string) => {
        setSelectedCredential({ id, name });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCredential) return;

        setIsDeleting(true);
        try {
            await deleteCredential(selectedCredential.id);
            toast.success("Credential deleted successfully");
            setIsDeleteModalOpen(false);
            setSelectedCredential(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete credential");
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
                            Show Burned Credentials
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
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">USER</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">PLATFORM</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">PLATFORM ID</TableHead>
                        <TableHead className="w-[20%] text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">USERNAME</TableHead>
                        <TableHead className="w-[20%] text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">PASSWORD</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                {hideBurned ? "No active credentials found." : "No credentials found matching the selected filters."}
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredData.map((credential) => {
                            const burned = isCredentialBurned(credential);
                            return (
                            <TableRow 
                                key={credential.id} 
                                className={cn(
                                    "border-[#1a1a1a] transition-colors",
                                    burned ? "bg-red-950/20 hover:bg-red-950/30" : "hover:bg-[#111]"
                                )}
                            >
                                <TableCell className="text-white py-4 font-medium text-sm">
                                    {((): string => {
                                        // Try direct account relation first
                                        const acc = credential.accounts;
                                        if (acc) {
                                            const account = Array.isArray(acc) ? acc[0] : acc;
                                            if (account && (account.first_name || account.last_name)) {
                                                return `${account.first_name || ""} ${account.last_name || ""}`.trim();
                                            }
                                        }
                                        
                                        // Fallback to package relation
                                        const pkg = credential.package?.[0];
                                        if (!pkg) return "-";
                                        const pkgAccounts = pkg.accounts;
                                        const pkgAcc = Array.isArray(pkgAccounts) ? pkgAccounts[0] : pkgAccounts;
                                        if (!pkgAcc) return "-";
                                        return `${pkgAcc.first_name || ""} ${pkgAcc.last_name || ""}`.trim() || "-";
                                    })()}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-[#1a1a1a] text-xs font-medium text-blue-400 border border-blue-500/20">
                                            {credential.platform || "N/A"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm font-mono">{credential.platform_id || "-"}</TableCell>
                                <TableCell className="text-white py-4 text-sm flex items-center gap-2">
                                    {credential.username || "-"}
                                    {credential.package?.some((pkg: any) => 
                                        pkg.funder_account?.some((fa: any) => fa.status === 'burned')
                                    ) && (
                                        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold w-fit border whitespace-nowrap bg-red-500/10 text-red-500 border-red-500/20" title="This credential is linked to a burned funder account">
                                            🔥 BURNED
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-white py-4 font-mono text-sm">
                                    <div className="flex items-center gap-2 group">
                                        <span className={!credential.password ? "text-red-500 font-bold text-xs" : ""}>
                                            {credential.password ? "********" : "NO PASSWORD"}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#262626]"
                                            onClick={() => handleCopy(credential.password || "", credential.id)}
                                        >
                                            {copiedId === credential.id ? (
                                                <Check className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <Copy className="h-3 w-3 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <EditCredentialDialog
                                            credential={credential}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-red-500 transition-colors"
                                            onClick={() => handleDeleteClick(credential.id, (credential as any).name || credential.username || "this credential")}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )})
                    )}
                </TableBody>
            </Table>

            <DeleteCredentialModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                credentialName={selectedCredential?.name || ""}
                isPending={isDeleting}
            />
        </div>
    )
}

export const CredentialsTableSkeleton = () => {
    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">USER</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">PLATFORM</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">PLATFORM ID</TableHead>
                        <TableHead className="w-[20%] text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">USERNAME</TableHead>
                        <TableHead className="w-[20%] text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">PASSWORD</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i} className="border-[#1a1a1a] hover:bg-transparent">
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[120px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-5 w-[80px] rounded bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[80px] bg-[#1a1a1a]" />
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
