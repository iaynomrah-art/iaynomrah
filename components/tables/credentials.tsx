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

interface Credential {
    id: number
    created_at: string
    user_id: number
    funder_id: number | null
    password?: string
    username?: string
    name?: string
    funders?: {
        name: string
        allias: string
        allias_color: string
        text_color: string
        [key: string]: any
    } | null
    accounts?: {
        first_name: string
        last_name: string
        [key: string]: any
    } | null
    [key: string]: any
}

interface CredentialsTableProps {
    data: Credential[]
}

export const CredentialsTable = ({ data }: CredentialsTableProps) => {
    const [copiedId, setCopiedId] = useState<number | null>(null)
    const [selectedCredential, setSelectedCredential] = useState<{ id: number, name: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCopy = async (password: string, id: number) => {
        try {
            await navigator.clipboard.writeText(password)
            setCopiedId(id)
            toast.success("Password copied to clipboard")
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            toast.error("Failed to copy password")
        }
    }

    const handleDeleteClick = (id: number, name: string) => {
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
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-1/5 text-muted-foreground font-medium text-sm pb-4">ACCOUNT NAME</TableHead>
                        <TableHead className="w-1/5 text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">FUNDER</TableHead>
                        <TableHead className="w-1/5 text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">USERNAME</TableHead>
                        <TableHead className="w-1/5 text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">PASSWORD</TableHead>
                        <TableHead className="w-1/5 text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                No credentials found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((credential) => (
                            <TableRow key={credential.id} className="border-[#1a1a1a] hover:bg-[#111] transition-colors">
                                <TableCell className="text-white py-4 font-medium text-sm">
                                    {credential.name || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm whitespace-nowrap">
                                    {credential.funders ? (
                                        <span
                                            className="px-2 py-1 rounded text-xs font-bold"
                                            style={{
                                                backgroundColor: credential.funders.allias_color || "#1c64f2",
                                                color: credential.funders.text_color || "white"
                                            }}
                                        >
                                            {credential.funders.allias || credential.funders.name}
                                        </span>
                                    ) : (
                                        "-"
                                    )}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">{credential.username || "-"}</TableCell>
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
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-white transition-colors">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-red-500 transition-colors"
                                            onClick={() => handleDeleteClick(credential.id, credential.name || "this credential")}
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
                        <TableHead className="w-1/5 text-muted-foreground font-medium text-sm pb-4">ACCOUNT NAME</TableHead>
                        <TableHead className="w-1/5 text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">FUNDER</TableHead>
                        <TableHead className="w-1/5 text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">USERNAME</TableHead>
                        <TableHead className="w-1/5 text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">PASSWORD</TableHead>
                        <TableHead className="w-1/5 text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i} className="border-[#1a1a1a] hover:bg-transparent">
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[150px] bg-[#1a1a1a]" />
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
