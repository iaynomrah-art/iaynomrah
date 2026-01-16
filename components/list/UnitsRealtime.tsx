"use client";

import React, { useEffect, useState } from "react";
import { UnitCard } from "../card/CardUnit";
import { createClient } from "@/lib/supabase/client";
import { getUnitsWithCounts, updateUnitStatus, archiveUnit } from "@/helper/units";
import { getFranchiseStyles } from "@/lib/utils";
import { UnitStatus } from "@/types/units";
import { ArchiveUnitModal } from "@/components/modal/ArchieveUniit";
import { toast } from "sonner";

interface UnitsRealtimeProps {
    initialData: any[];
}

export function UnitsRealtime({ initialData }: UnitsRealtimeProps) {
    const [units, setUnits] = useState(initialData);
    const supabase = createClient();

    const [selectedUnit, setSelectedUnit] = useState<{ id: number, name: string } | null>(null);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

    const fetchLatestData = async () => {
        const latestData = await getUnitsWithCounts();
        setUnits(latestData);
    }

    useEffect(() => {
        fetchLatestData();

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
            console.error("Error updating unit status:", error);
            toast.error("Failed to update status");
        }
    }

    const handleArchiveClick = (id: number, name: string) => {
        setSelectedUnit({ id, name });
        setIsArchiveModalOpen(true);
    }

    const handleArchiveConfirm = async () => {
        if (!selectedUnit) return;

        setIsArchiving(true);
        try {
            await archiveUnit(selectedUnit.id);
            toast.success(`${selectedUnit.name} archived successfully`);
            setIsArchiveModalOpen(false);
            setSelectedUnit(null);
        } catch (error: any) {
            console.error("Error archiving unit:", error);
            toast.error("Failed to archive unit");
        } finally {
            setIsArchiving(false);
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {units
                    .filter(unit => !unit.archived) // Only show non-archived units
                    .map((unit) => {
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
                unitName={selectedUnit?.name || ""}
                isPending={isArchiving}
            />
        </>
    );
}
