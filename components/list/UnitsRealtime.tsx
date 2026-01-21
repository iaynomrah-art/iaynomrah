"use client";

import React, { useEffect, useState } from "react";
import { UnitCard } from "../card/CardUnit";
import { createClient } from "@/lib/supabase/client";
import { getFranchiseStyles } from "@/lib/utils";
import { UnitStatus } from "@/types/units";
import { ArchiveUnitModal } from "@/components/modal/ArchieveUniit";
import { toast } from "sonner";

import { getUnitsWithCounts, updateUnitStatus, archiveUnit, checkUnitHealth, getUnits } from "@/helper/units";
import { getFranchises } from "@/helper/franchise";
import { Franchise } from "@/types/franchise";
import { UnitModal } from "../modal/Update/UnitModal";
import { SearchBarHeader } from "../ui/search-bar-header";
import { Unit } from "@/types/units";

interface UnitsRealtimeProps {
    initialData: any[];
    searchQuery?: string;
}

export const UnitsRealtime = React.forwardRef(({ initialData, searchQuery: externalSearchQuery }: UnitsRealtimeProps, ref) => {
    const [units, setUnits] = useState(initialData);
    const [franchises, setFranchises] = useState<Franchise[]>([]);
    const [searchQuery, setSearchQuery] = useState(externalSearchQuery || "");

    // Update internal search query if external prop changes
    useEffect(() => {
        if (externalSearchQuery !== undefined) {
            setSearchQuery(externalSearchQuery);
        }
    }, [externalSearchQuery]);
    const supabase = createClient();

    const [selectedUnitForArchive, setSelectedUnitForArchive] = useState<{ id: number, name: string } | null>(null);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);

    const fetchLatestData = async () => {
        const [latestUnits, latestFranchises] = await Promise.all([
            getUnitsWithCounts(),
            getFranchises()
        ]);
        setUnits(latestUnits);
        setFranchises(latestFranchises);
        return latestUnits;
    }

    useEffect(() => {
        const init = async () => {
            const data = await fetchLatestData();

            // Onload health check
            /* data.forEach(async (unit) => {
                if (unit.api_base_url && !unit.archived) {
                    const isHealthy = await checkUnitHealth(unit.api_base_url);
                    const newStatus: UnitStatus = isHealthy ? "enabled" : "not connected";

                    if (unit.status !== newStatus) {
                        try {
                            await updateUnitStatus(unit.id, newStatus);
                        } catch (error) {
                            console.error(`Status update failed for unit ${unit.unit_name}`);
                        }
                    }
                }
            }); */
        };

        init();

        const channel = supabase
            .channel('realtime_units')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, () => {
                fetchLatestData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'funder_account' }, () => {
                fetchLatestData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleStatusChange = async (unitId: number, newStatus: UnitStatus) => {
        try {
            await updateUnitStatus(unitId, newStatus);
        } catch (error: any) {
            console.error("Error updating unit status:");
            toast.error("Failed to update status");
        }
    }

    const handleArchiveClick = (id: number, name: string) => {
        setSelectedUnitForArchive({ id, name });
        setIsArchiveModalOpen(true);
    }

    const handleArchiveConfirm = async () => {
        if (!selectedUnitForArchive) return;

        setIsArchiving(true);
        try {
            await archiveUnit(selectedUnitForArchive.id);
            toast.success(`${selectedUnitForArchive.name} archived successfully`);
            setIsArchiveModalOpen(false);
            setSelectedUnitForArchive(null);
        } catch (error: any) {
            console.error("Error archiving unit:", error);
            toast.error("Failed to archive unit");
        } finally {
            setIsArchiving(false);
        }
    }

    const handleEditClick = (id: number) => {
        const unit = units.find(u => u.id === id);
        if (unit) {
            setUnitToEdit(unit);
            setIsUnitModalOpen(true);
        }
    }

    const handleAddClick = () => {
        setUnitToEdit(null);
        setIsUnitModalOpen(true);
    }

    const filteredUnits = units.filter(unit => {
        const matchesSearch = unit.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            unit.franchise?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            unit.franchise?.code?.toLowerCase().includes(searchQuery.toLowerCase());
        return !unit.archived && matchesSearch;
    });

    React.useImperativeHandle(ref, () => ({
        handleAddClick
    }));

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {filteredUnits.map((unit) => {
                    const styles = getFranchiseStyles(unit.franchise?.code);
                    return (
                        <UnitCard
                            key={unit.id}
                            id={unit.id}
                            code={unit.unit_name}
                            shortName={unit.franchise?.code || "UN"}
                            company={unit.franchise?.name}
                            status={unit.status || "disabled"}
                            serial={unit.unit_id?.substring(0, 8).toUpperCase() || "N/A"}
                            owner="System"
                            {...styles}
                            onStatusChange={handleStatusChange}
                            onArchive={handleArchiveClick}
                            onEdit={handleEditClick}
                            tags={unit.funder_counts?.map((fc: any) => ({
                                label: fc.allias,
                                count: fc.count,
                                bgColor: fc.allias_color,
                                textColor: fc.text_color
                            })) || []}
                        />
                    );
                })}
            </div>

            <ArchiveUnitModal
                isOpen={isArchiveModalOpen}
                onClose={() => setIsArchiveModalOpen(false)}
                onConfirm={handleArchiveConfirm}
                unitName={selectedUnitForArchive?.name || ""}
                isPending={isArchiving}
            />

            <UnitModal
                isOpen={isUnitModalOpen}
                onClose={() => setIsUnitModalOpen(false)}
                initialData={unitToEdit}
                onSuccess={fetchLatestData}
                franchises={franchises}
                units={units}
            />
        </div>
    );
});

UnitsRealtime.displayName = "UnitsRealtime";
