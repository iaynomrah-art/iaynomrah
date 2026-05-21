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
import { DeletePackageModal } from "@/components/modal/Delete/DeletePackage"
import { deletePackage } from "@/helper/package"
import { toast } from "sonner"

interface Package {
    id: string
    name: string
    balance?: string | number
    phase?: string
    instrument?: string
    purchase_price?: string | number
    funders?: {
        name: string
    }
    [key: string]: any
}

interface PackagesTableProps {
    data: Package[]
    onEdit: (pkg: Package) => void
    onDeleteSuccess?: () => void
}

export const PackagesTable = ({ data, onEdit, onDeleteSuccess }: PackagesTableProps) => {
    const [selectedPackage, setSelectedPackage] = useState<{ id: string, name: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: string, name: string) => {
        setSelectedPackage({ id, name });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPackage) return;

        setIsDeleting(true);
        try {
            await deletePackage(selectedPackage.id);
            toast.success("Package deleted successfully");
            setIsDeleteModalOpen(false);
            setSelectedPackage(null);
            if (onDeleteSuccess) {
                onDeleteSuccess();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete package");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">FUNDER</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">PACKAGE NAME</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">BALANCE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">PURCHASE PRICE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">PHASE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">INSTRUMENT</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">DAILY LOSS</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">TOTAL LOSS</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">DAILY PROFIT TGT</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">MAX PROFIT TARGET</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                No packages found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id} className="border-[#1a1a1a] hover:bg-[#111] transition-colors">
                                <TableCell className="text-white py-4 font-medium text-sm">
                                    {item.funders?.name || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">{item.name}</TableCell>
                                <TableCell className="text-white py-4 text-sm">{item.balance || "-"}</TableCell>
                                <TableCell className="text-white py-4 text-sm">${item.purchase_price || "0"}</TableCell>
                                <TableCell className="text-white py-4 text-sm">{item.phase || "-"}</TableCell>
                                <TableCell className="text-white py-4 text-sm">{item.symbol || "-"}</TableCell>
                                <TableCell className="text-white py-4 text-sm">${item.max_daily_loss || "0"}</TableCell>
                                <TableCell className="text-white py-4 text-sm">${item.max_total_loss || "0"}</TableCell>
                                <TableCell className="text-white py-4 text-sm">${item.daily_profit_target || "0"}</TableCell>
                                <TableCell className="text-white py-4 text-sm">${item.profit_target || "0"}</TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(item)}
                                            className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-white transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-red-500 transition-colors"
                                            onClick={() => handleDeleteClick(item.id, item.name)}
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

            <DeletePackageModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                packageName={selectedPackage?.name || ""}
                isPending={isDeleting}
            />
        </div>
    )
}

export const PackagesTableSkeleton = () => {
    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">FUNDER</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4">PACKAGE NAME</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">BALANCE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">PURCHASE PRICE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">PHASE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">INSTRUMENT</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">DAILY LOSS</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">TOTAL LOSS</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">DAILY PROFIT TGT</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">MAX PROFIT TARGET</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i} className="border-[#1a1a1a] hover:bg-transparent">
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[120px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[80px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[80px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[80px] bg-[#1a1a1a]" />
                            </TableCell>
                             <TableCell className="py-4">
                                <Skeleton className="h-4 w-[80px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[60px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[60px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[60px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[60px] bg-[#1a1a1a]" />
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
