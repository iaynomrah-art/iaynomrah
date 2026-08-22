"use client";

import React, { useState, useEffect } from 'react'
import { getUnitsWithCounts, updateUnitStatus, archiveUnit } from '@/helper/units'
import { createClient } from '@/lib/supabase/client'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, Filter } from 'lucide-react'

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
    const [role, setRole] = useState<string | null>(null);
    const [selectedFranchise, setSelectedFranchise] = useState<string>("all");
    const [filterOccupiedOnly, setFilterOccupiedOnly] = useState(false);
    const [filterEnabledOnly, setFilterEnabledOnly] = useState(false);
    const refreshUnitsSilent = async () => {
        try {
            const data = await getUnitsWithCounts();
            setUnits(data as any);
        } catch (error) {
            console.error("Failed to refresh units silently:", error);
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setRole(user.app_metadata?.role || null);
            }
        };
        fetchUser();

        const supabase = createClient();
        const channel = supabase
            .channel('realtime_units_client')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, () => {
                refreshUnitsSilent();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'funder_account' }, () => {
                refreshUnitsSilent();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const data = await getUnitsWithCounts();
            setUnits(data as any);
            toast.success("Units refreshed");

        } catch (error) {
            toast.error("Failed to refresh units");
        } finally {
            setIsRefreshing(false);
        }
    };



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

    // Get unique franchises for the filter
    const uniqueFranchises = Array.from(new Set(units
        .map(u => u.franchise?.name)
        .filter(Boolean)))
        .sort() as string[];

    const filteredUnits = units.filter((unit: any) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            unit.unit_name?.toLowerCase().includes(query) ||
            unit.franchise?.name?.toLowerCase().includes(query) ||
            unit.franchise?.code?.toLowerCase().includes(query)
        );
        const matchesFranchise = selectedFranchise === "all" || unit.franchise?.name === selectedFranchise;
        const matchesOccupied = !filterOccupiedOnly || unit.is_occupied;
        const matchesEnabled = !filterEnabledOnly || unit.status === 'enabled';

        return !unit.archived && matchesSearch && matchesFranchise && matchesOccupied && matchesEnabled;
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
                        {role === 'super-admin' && (
                            <Select value={selectedFranchise} onValueChange={setSelectedFranchise}>
                                <SelectTrigger className="w-[180px] h-10 bg-[#0d0d0d] border-gray-800 text-gray-300 focus:ring-blue-500/20">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-gray-500" />
                                        <SelectValue placeholder="All Franchises" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-[#0d0d0d] border-gray-800 text-gray-300">
                                    <SelectItem value="all">All Franchises</SelectItem>
                                    {uniqueFranchises.map((f) => (
                                        <SelectItem key={f} value={f}>
                                            {f}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 bg-[#0d0d0d] border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 focus:ring-0">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filters
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-[#0d0d0d] border-gray-800 text-gray-300" align="end">
                                <DropdownMenuLabel>Filter Units</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-800" />
                                <DropdownMenuCheckboxItem
                                    checked={filterOccupiedOnly}
                                    onCheckedChange={setFilterOccupiedOnly}
                                    className="focus:bg-gray-800 focus:text-white cursor-pointer"
                                >
                                    Occupied Only
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={filterEnabledOnly}
                                    onCheckedChange={setFilterEnabledOnly}
                                    className="focus:bg-gray-800 focus:text-white cursor-pointer"
                                >
                                    Enabled Only
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <UnitsSearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />

                        {role === 'super-admin' && (
                            <Button
                                onClick={() => setIsFranchiseModalOpen(true)}
                                className="h-10 bg-[#16a34a] hover:bg-[#15803d] text-white font-medium px-4 gap-2 shadow-lg shadow-green-900/10 transition-all active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Franchise</span>
                                <span className="sm:hidden">Franchise</span>
                            </Button>
                        )}

                        {role === 'super-admin' && (
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
                        )}
                    </div>
                </div>
            </div>

            <div className="h-full">
                <UnitsList
                    units={filteredUnits}
                    onEdit={handleEdit}
                    onArchive={handleArchive}
                    onStatusChange={handleStatusChange}
                    role={role}
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
