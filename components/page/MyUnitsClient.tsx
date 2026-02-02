"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getUnitsWithCounts, updateUnitStatus, archiveUnit, checkUnitHealth } from '@/helper/units'
import { UnitsSearch } from '@/components/search/UnitsSearch'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import UnitsList from '@/components/list/UnitsList'
import { UnitModal } from '@/components/modal/Update/UnitModal'
import { Unit } from "@/types/units"
import { ArchiveUnitModal } from "@/components/modal/ArchieveUniit"
import { FranchiseModal } from "@/components/modal/FranchiseModal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MyUnitsClientProps {
    initialUnits: any[];
}

export default function MyUnitsClient({ initialUnits }: MyUnitsClientProps) {
    const [units, setUnits] = useState(initialUnits);
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);
    const [selectedUnitForArchive, setSelectedUnitForArchive] = useState<{ id: string, name: string } | null>(null);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isFranchiseModalOpen, setIsFranchiseModalOpen] = useState(false);

    // Use a ref to prevent multiple simultaneous health checks
    const isCheckingHealth = useRef(false);

    const handleHealthCheck = useCallback(async (unitsToCheck: any[]) => {
        if (isCheckingHealth.current || unitsToCheck.length === 0) return;

        isCheckingHealth.current = true;
        const checkToast = toast.loading(`Checking health for ${unitsToCheck.length} units...`);

        try {
            let healthyCount = 0;
            let failedCount = 0;

            const results = await Promise.all(unitsToCheck.map(async (unit) => {
                if (!unit.api_base_url) return null;

                const isHealthy = await checkUnitHealth(unit.api_base_url);
                const newStatus = isHealthy ? "enabled" : "not connected" as any;

                // Only update if status changed
                if (unit.status !== newStatus) {
                    await updateUnitStatus(unit.id, newStatus);
                    if (isHealthy) healthyCount++;
                    else failedCount++;
                    return { id: unit.id, status: newStatus };
                }

                if (isHealthy) healthyCount++;
                else failedCount++;
                return null;
            }));

            const updates = results.filter(r => r !== null);
            if (updates.length > 0) {
                setUnits((prev: any) => prev.map((u: any) => {
                    const result = updates.find(r => r!.id === u.id);
                    return result ? { ...u, status: result.status } : u;
                }));
            }

            toast.success(`Health check complete: ${healthyCount} healthy, ${failedCount} failed`, {
                id: checkToast,
            });
        } catch (err) {
            toast.error("Failed to complete health check", {
                id: checkToast,
            });
        } finally {
            isCheckingHealth.current = false;
        }
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const data = await getUnitsWithCounts();
            setUnits(data as any);
            toast.success("Units refreshed");
            // Run health check after refresh
            const unitsWithApi = data.filter((u: any) => u.api_base_url && !u.archived);
            handleHealthCheck(unitsWithApi);
        } catch (error) {
            toast.error("Failed to refresh units");
        } finally {
            setIsRefreshing(false);
        }
    };

    // Run health check on mount (every visit)
    useEffect(() => {
        const unitsWithApi = units.filter((u: any) => u.api_base_url && !u.archived);
        if (unitsWithApi.length > 0) {
            handleHealthCheck(unitsWithApi);
        }
    }, []); // Empty dependency array runs once on mount

    const handleEdit = (unit: Unit) => {
        setUnitToEdit(unit);
        setIsUnitModalOpen(true);
    };

    const handleArchive = (id: string, name: string) => {
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
            handleRefresh();
        } catch (error: any) {
            console.error("Error archiving unit:", error);
            toast.error("Failed to archive unit");
        } finally {
            setIsArchiving(false);
        }
    };

    const handleStatusChange = async (unitId: string, newStatus: any) => {
        try {
            setUnits((prev: any) => prev.map((u: any) =>
                u.id === unitId ? { ...u, status: newStatus } : u
            ));

            await updateUnitStatus(unitId, newStatus);
        } catch (error: any) {
            toast.error("Failed to update status");
            handleRefresh();
        }
    }

    const filteredUnits = units.filter((unit: any) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            unit.unit_name?.toLowerCase().includes(query) ||
            unit.franchise?.name?.toLowerCase().includes(query) ||
            unit.franchise?.code?.toLowerCase().includes(query)
        );
        return !unit.archived && matchesSearch;
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
                            onClick={() => setIsFranchiseModalOpen(true)}
                            className="h-10 bg-[#16a34a] hover:bg-[#15803d] text-white font-medium px-4 gap-2 shadow-lg shadow-green-900/10 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Franchise</span>
                            <span className="sm:hidden">Franchise</span>
                        </Button>

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
                    </div>
                </div>
            </div>

            <div className="h-full">
                <UnitsList
                    units={filteredUnits}
                    onEdit={handleEdit}
                    onArchive={handleArchive}
                    onStatusChange={handleStatusChange}
                />
            </div>

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
