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
import { Pencil, Trash2, Copy, Check } from "lucide-react"
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
    funders?: any[] // Keep for now if needed by other components, though unused here
}

export const CredentialsTable = ({ data, funders = [] }: CredentialsTableProps) => {
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [selectedCredential, setSelectedCredential] = useState<{ id: string, name: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'burned'>('active');

    const isCredentialBurned = (credential: Credential) => {
        return credential.package?.some((pkg: any) => 
            pkg.funder_account?.some((fa: any) => fa.status === 'burned')
        ) || false;
    };

    const filteredData = data.filter(credential => {
        const burned = isCredentialBurned(credential);
        return activeTab === 'active' ? !burned : burned;
    });

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
                <Button
                    variant="ghost"
                    onClick={() => setActiveTab('active')}
                    className={cn(
                        "h-8 px-4 text-xs font-semibold tracking-wider uppercase rounded-full transition-all duration-300",
                        activeTab === 'active' 
                            ? "bg-white text-black hover:bg-gray-200" 
                            : "text-muted-foreground hover:text-white hover:bg-[#1a1a1a]"
                    )}
                >
                    Active
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setActiveTab('burned')}
                    className={cn(
                        "h-8 px-4 text-xs font-semibold tracking-wider uppercase rounded-full transition-all duration-300",
                        activeTab === 'burned' 
                            ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                            : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                    )}
                >
                    Burned
                </Button>
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
                                {activeTab === 'active' ? "No active credentials found." : "No burned credentials found."}
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
                                        <span>********</span>
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
