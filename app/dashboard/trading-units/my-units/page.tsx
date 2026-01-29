"use client";

import React, { Suspense, useState, useRef, useEffect } from 'react'
import { getUnits, getUnitsWithCounts } from '@/helper/units'
import { UnitsSearch } from '@/components/search/UnitsSearch'
import { UnitsRealtime } from '@/components/list/UnitsRealtime'
import { UnitSkeleton } from '@/components/skeleton/UnitSkeleton'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import UnitsList from '@/components/list/UnitsList'
import { UnitModal } from '@/components/modal/Update/UnitModal'

import { Unit } from "@/types/units"
import { ArchiveUnitModal } from "@/components/modal/ArchieveUniit"
import { FranchiseModal } from "@/components/modal/FranchiseModal"
import { toast } from "sonner"
import { updateUnitStatus, archiveUnit } from "@/helper/units"

const page = () => {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Archive states
    const [selectedUnitForArchive, setSelectedUnitForArchive] = useState<{ id: number, name: string } | null>(null);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isFranchiseModalOpen, setIsFranchiseModalOpen] = useState(false);

    // Edit state
    const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);

    const fetchUnits = async () => {
        const data = await getUnitsWithCounts();
        setUnits(data as any);
        setLoading(false);
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchUnits();
    };

    const handleEdit = (unit: Unit) => {
        setUnitToEdit(unit);
        setIsUnitModalOpen(true);
    };

    const handleArchive = (id: number, name: string) => {
        setSelectedUnitForArchive({ id, name });
        setIsArchiveModalOpen(true);
    };

    const handleArchiveConfirm = async () => {
        if (!selectedUnitForArchive) return;

        setIsArchiving(true);
        try {
            await archiveUnit(selectedUnitForArchive.id);
            toast.success(`${selectedUnitForArchive.name} archived successfully`);
            setIsArchiveModalOpen(false);
            setSelectedUnitForArchive(null);
            fetchUnits();
        } catch (error: any) {
            console.error("Error archiving unit:", error);
            toast.error("Failed to archive unit");
        } finally {
            setIsArchiving(false);
        }
    };

    const handleStatusChange = async (unitId: number, newStatus: any) => {
        try {
            setUnits((prev: any) => prev.map((u: any) =>
                u.id === unitId ? { ...u, status: newStatus } : u
            ));

            await updateUnitStatus(unitId, newStatus);
            toast.success("Status updated");
        } catch (error: any) {
            toast.error("Failed to update status");
            fetchUnits();
        }
    }

    const filteredUnits = units.filter((unit: any) => {
        const query = searchQuery.toLowerCase();
        return (
            unit.unit_name?.toLowerCase().includes(query) ||
            unit.franchise?.name?.toLowerCase().includes(query) ||
            unit.franchise?.code?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="flex flex-col h-full bg-[#050505] min-h-screen">
            <div className="px-6 pt-6 pb-6 bg-[#050505] sticky top-0 z-10 border-b border-gray-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-white tracking-tight">My Units</h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="h-8 w-8 text-gray-500 hover:text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <UnitsSearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />

                        <Button
                            onClick={() => {
                                setUnitToEdit(null);
                                setIsUnitModalOpen(true);
                            }}
                            className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 gap-2 shadow-lg shadow-blue-900/10 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Add Unit</span>
                            <span className="sm:hidden">Add</span>
                        </Button>

                        <Button
                            onClick={() => setIsFranchiseModalOpen(true)}
                            className="h-10 bg-[#16a34a] hover:bg-[#15803d] text-white font-medium px-4 gap-2 shadow-lg shadow-green-900/10 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Franchise</span>
                            <span className="sm:hidden">Franchise</span>
                        </Button>
                    </div>
                </div>
            </div>
            {loading ? (
                <UnitSkeleton />
            ) : (
                <div className="h-full">
                    <UnitsList
                        units={filteredUnits}
                        onEdit={handleEdit}
                        onArchive={handleArchive}
                        onStatusChange={handleStatusChange}
                    />
                </div>
            )}

            <UnitModal
                isOpen={isUnitModalOpen}
                initialData={unitToEdit}
                onClose={() => {
                    setIsUnitModalOpen(false);
                    setUnitToEdit(null);
                }}
                onSuccess={() => {
                    handleRefresh();
                    setIsUnitModalOpen(false);
                    setUnitToEdit(null);
                }}
            />

            <ArchiveUnitModal
                isOpen={isArchiveModalOpen}
                onClose={() => setIsArchiveModalOpen(false)}
                onConfirm={handleArchiveConfirm}
                unitName={selectedUnitForArchive?.name || ""}
                isPending={isArchiving}
            />

            <FranchiseModal
                isOpen={isFranchiseModalOpen}
                onClose={() => setIsFranchiseModalOpen(false)}
            />
        </div>
    )
}

export default page