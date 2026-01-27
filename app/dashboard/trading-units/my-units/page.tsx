"use client";

import React, { Suspense, useState, useRef, useEffect } from 'react'
import { getUnitsWithCounts } from '@/helper/units'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { UnitsRealtime } from '@/components/list/UnitsRealtime'
import { UnitSkeleton } from '@/components/skeleton/UnitSkeleton'

const UnitsList = () => {
    const [units, setUnits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const unitsRef = useRef<any>(null);

    const fetchUnits = async () => {
        try {
            const data = await getUnitsWithCounts();
            setUnits(data);

        } catch (error) {
            console.error("Failed to fetch units:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchUnits();
    }, []);

    const handleAddClick = () => {
        if (unitsRef.current) {
            unitsRef.current.handleAddClick();
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#050505]">
            <div className="px-6 pt-6 bg-[#050505] sticky top-0 z-10">
                <SearchBarHeader
                    title="My Units"
                    addButtonText="Add Unit"
                    showFilter={false}
                    onAddClick={handleAddClick}
                    onSearchChange={setSearchQuery}
                />
            </div>

            <div className="flex-1">
                {isLoading ? (
                    <UnitSkeleton />
                ) : (
                    <UnitsRealtime
                        ref={unitsRef}
                        initialData={units}
                        searchQuery={searchQuery}
                    />
                )}
            </div>
        </div>
    );
};

export default function Page() {
    return (
        <div suppressHydrationWarning className="min-h-full bg-[#050505] flex flex-col h-full">
            <UnitsList />
        </div>
    )
}