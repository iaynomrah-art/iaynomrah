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
import { cn } from "@/lib/utils"

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
    const [activeTab, setActiveTab] = useState<'active' | 'burned'>('active');

    const filteredData = data.filter(item => {
        const isBurned = item.funder_account?.some((fa: any) => fa.status === 'burned') || false;
        return activeTab === 'active' ? !isBurned : isBurned;
    });

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
                        <TableHead className="w-[20%] text-muted-foreground font-medium text-sm pb-4">PACKAGE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">EQUITY</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">PRICE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">PHASE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">INSTRUMENT</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">DRAWDOWN LIMITS</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">PROFIT TARGETS</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4 text-right pr-6">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                {activeTab === 'active' ? "No active packages found." : "No burned packages found."}
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredData.map((item) => {
                            const isBurned = item.funder_account?.some((fa: any) => fa.status === 'burned');
                            const balance = Number(item.balance || 0);
                            const dailyLossValue = item.max_daily_loss ? Number(item.max_daily_loss) : null;
                            const totalLossValue = item.max_total_loss ? Number(item.max_total_loss) : null;
                            const dailyProfitValue = item.daily_profit_target ? Number(item.daily_profit_target) : null;
                            const totalProfitValue = item.profit_target ? Number(item.profit_target) : null;

                            const dailyLossPercent = dailyLossValue !== null && balance > 0 ? Number(((dailyLossValue / balance) * 100).toFixed(2)) : 0;
                            const totalLossPercent = totalLossValue !== null && balance > 0 ? Number(((totalLossValue / balance) * 100).toFixed(2)) : 0;
                            const dailyProfitPercent = dailyProfitValue !== null && balance > 0 ? Number(((dailyProfitValue / balance) * 100).toFixed(2)) : 0;
                            const totalProfitPercent = totalProfitValue !== null && balance > 0 ? Number(((totalProfitValue / balance) * 100).toFixed(2)) : 0;

                            return (
                                <TableRow 
                                    key={item.id} 
                                    className={cn(
                                        "border-[#1a1a1a] transition-colors",
                                        isBurned ? "bg-red-950/20 hover:bg-red-950/30" : "hover:bg-[#111]"
                                    )}
                                >
                                    <TableCell className="text-white py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-white">{item.name}</span>
                                                {isBurned ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap bg-red-500/10 text-red-500 border-red-500/20 shadow-sm" title="This package is linked to a burned funder account">
                                                        🔥 BURNED
                                                    </span>
                                                ) : (!item.funder_account || item.funder_account.length === 0) && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap bg-gray-500/10 text-gray-400 border-gray-500/20 shadow-sm" title="This package has not been linked to a funder account yet">
                                                        UNUSED
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 leading-none">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Funder:</span>
                                                    <span className="text-[11px] text-white font-bold">{item.funders?.name || "No Funder"}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 leading-none mt-0.5">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Account:</span>
                                                    <span className="text-[11px] text-blue-400 font-bold">
                                                        {item.account ? `${item.account.first_name} ${item.account.last_name}` : "Unlinked"}
                                                    </span>
                                                </div>
                                                {item.credential && (
                                                    <div className="flex items-center gap-1.5 leading-none mt-0.5">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Creds:</span>
                                                        <span className="text-[10px] text-gray-400 font-mono font-medium">{item.credential.username}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-white py-4 font-mono text-sm tracking-tight">${Number(item.balance || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-white py-4 font-mono text-sm tracking-tight">${Number(item.purchase_price || 0).toLocaleString()}</TableCell>
                                    <TableCell className="py-4">
                                        <span className="px-2.5 py-1 rounded-md bg-[#1a1a1a] text-xs font-medium text-emerald-400 border border-emerald-500/20 capitalize shadow-sm">
                                            {item.phase || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="px-2.5 py-1 rounded-md bg-[#1a1a1a] text-xs font-medium text-blue-400 border border-blue-500/20 capitalize shadow-sm">
                                            {item.symbol || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4 pr-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="text-muted-foreground w-10">Daily</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-red-400 font-medium">{dailyLossPercent}%</span>
                                                    {dailyLossValue !== null && <span className="font-mono text-muted-foreground text-[10px]">(${dailyLossValue.toLocaleString()})</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="text-muted-foreground w-10">Total</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-red-400 font-medium">{totalLossPercent}%</span>
                                                    {totalLossValue !== null && <span className="font-mono text-muted-foreground text-[10px]">(${totalLossValue.toLocaleString()})</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 pr-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="text-muted-foreground w-10">Daily</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-emerald-400 font-medium">{dailyProfitPercent}%</span>
                                                    {dailyProfitValue !== null && <span className="font-mono text-muted-foreground text-[10px]">(${dailyProfitValue.toLocaleString()})</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="text-muted-foreground w-10">Total</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-emerald-400 font-medium">{totalProfitPercent}%</span>
                                                    {totalProfitValue !== null && <span className="font-mono text-muted-foreground text-[10px]">(${totalProfitValue.toLocaleString()})</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 pr-6">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(item)}
                                                className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-white transition-colors rounded-full"
                                                title="Edit Package"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors rounded-full"
                                                onClick={() => handleDeleteClick(item.id, item.name)}
                                                title="Delete Package"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })
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
                        <TableHead className="w-[20%] text-muted-foreground font-medium text-sm pb-4">PACKAGE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">EQUITY</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">PRICE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">PHASE</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4">INSTRUMENT</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">DRAWDOWN LIMITS</TableHead>
                        <TableHead className="w-[15%] text-muted-foreground font-medium text-sm pb-4 whitespace-nowrap">PROFIT TARGETS</TableHead>
                        <TableHead className="w-[10%] text-muted-foreground font-medium text-sm pb-4 text-right pr-6">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i} className="border-[#1a1a1a] hover:bg-transparent">
                            <TableCell className="py-4">
                                <Skeleton className="h-8 w-[120px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[80px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[60px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-6 w-[80px] rounded-full bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-6 w-[80px] rounded-full bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-[100px] bg-[#1a1a1a]" />
                                    <Skeleton className="h-3 w-[100px] bg-[#1a1a1a]" />
                                </div>
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-[100px] bg-[#1a1a1a]" />
                                    <Skeleton className="h-3 w-[100px] bg-[#1a1a1a]" />
                                </div>
                            </TableCell>
                            <TableCell className="py-4 pr-6">
                                <div className="flex items-center justify-end gap-2">
                                    <Skeleton className="h-8 w-8 rounded-full bg-[#1a1a1a]" />
                                    <Skeleton className="h-8 w-8 rounded-full bg-[#1a1a1a]" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
