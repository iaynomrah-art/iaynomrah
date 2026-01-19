import React, { Suspense } from 'react'
import { getUnitsWithCounts } from '@/helper/units'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { UnitsRealtime } from '@/components/list/UnitsRealtime'
import { UnitSkeleton } from '@/components/skeleton/UnitSkeleton'
import { Button } from '@/components/ui/button'


const UnitsList = async () => {
    const units = await getUnitsWithCounts();
    return <UnitsRealtime initialData={units} />;
};

const page = () => {
    return (
        <div suppressHydrationWarning className="min-h-full bg-[#050505] flex flex-col h-full">
            {/* Content Section */}
            <div className="flex-1">
                <Suspense fallback={<UnitSkeleton />}>
                    <UnitsList />
                </Suspense>
            </div>
        </div>
    )
}

export default page