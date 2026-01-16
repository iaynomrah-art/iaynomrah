"use client";

import React, { useEffect, useState } from "react";
import { UnitCard } from "./CardUnit";
import { createClient } from "@/lib/supabase/client";
import { getUnitsWithCounts } from "@/helper/units";
import { getFranchiseStyles } from "@/lib/utils";

interface UnitsRealtimeProps {
    initialData: any[];
}

export function UnitsRealtime({ initialData }: UnitsRealtimeProps) {
    const [units, setUnits] = useState(initialData);
    const supabase = createClient();

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

    const handleStatusChange = async (unitId: number, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("units")
                .update({ status: newStatus })
                .eq("id", unitId);

            if (error) throw error;
            // No need for setUnits here as realtime will trigger fetchLatestData
        } catch (error: any) {
            console.error("Error updating unit status:", error);
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {units.map((unit) => {
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
                        owner="System" // Hardcoded for now
                        {...styles}
                        onStatusChange={handleStatusChange}
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
    );
}
