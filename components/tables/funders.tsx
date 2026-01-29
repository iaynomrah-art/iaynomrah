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
import { Funder } from "@/types/funder"
import { DeleteFunderModal } from "@/components/modal/Delete/DeleteFunder"
import { deleteFunder } from "@/helper/funders"
import { toast } from "sonner"
import Link from "next/link"


const formatResetTime = (time?: string | null) => {
    if (!time) return "-";

    // Extract HH:mm from various formats (ISO, HH:mm:ss, HH:mm)
    let hours = "";
    let minutes = "";

    if (time.includes('T')) {
        const date = new Date(time);
        if (!isNaN(date.getTime())) {
            hours = date.getHours().toString().padStart(2, '0');
            minutes = date.getMinutes().toString().padStart(2, '0');
        }
    } else {
        const parts = time.split(':');
        if (parts.length >= 2) {
            hours = parts[0].padStart(2, '0');
            minutes = parts[1].padStart(2, '0');
        }
    }

    if (hours && minutes) {
        return `${hours}:${minutes} GMT+08:00 (Hong Kong)`;
    }

    return `${time} GMT+08:00 (Hong Kong)`;
}

interface FundersTableProps {
    data: Funder[]
    onEdit: (funder: Funder) => void
}

export const FundersTable = ({ data, onEdit }: FundersTableProps) => {
    const [selectedFunder, setSelectedFunder] = useState<{ id: number, name: string | null } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: number, name: string | null) => {
        setSelectedFunder({ id, name });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedFunder) return;

        setIsDeleting(true);
        try {
            await deleteFunder(selectedFunder.id);
            toast.success("Funder deleted successfully");
            setIsDeleteModalOpen(false);
            setSelectedFunder(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete funder");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm pb-4">FUNDER NAME</TableHead>
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm pb-4">FUNDER ALIAS</TableHead>
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm pb-4">RESET TIME</TableHead>
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                No funders found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((funder) => (
                            <TableRow key={funder.id} className="border-[#1a1a1a] hover:bg-[#111] transition-colors">
                                <TableCell className="text-white py-4 font-medium text-sm">{funder.name || "-"}</TableCell>
                                <TableCell className="text-white py-4 text-sm">{funder.allias || "-"}</TableCell>
                                <TableCell className="text-white py-4 text-sm">{formatResetTime(funder.reset_time)}</TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(funder)}
                                            className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-white transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteClick(funder.id, funder.name)}
                                            className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-red-500 transition-colors"
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

            <DeleteFunderModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                funderName={selectedFunder?.name || ""}
                isPending={isDeleting}
            />
        </div>
    )
}
