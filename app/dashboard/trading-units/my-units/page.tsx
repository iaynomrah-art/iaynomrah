import React, { Suspense } from 'react'
import { getUnits } from '@/helper/units'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { UnitsTable, UnitsTableSkeleton } from '@/components/tables/units'

const UnitsList = async () => {
    const units = await getUnits();
    return (
        <div className="px-6 pb-6">
            <UnitsTable data={units} />
        </div>
    );
};

const page = () => {
    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] min-h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="My Units"
                        addButtonText="Add Unit"
                    />
                </div>

                {/* Content Section */}
                <Suspense fallback={
                    <div className="px-6 pb-6">
                        <UnitsTableSkeleton />
                    </div>
                }>
                    <UnitsList />
                </Suspense>
            </div>
        </div>
    )
}

export default page