import React, { Suspense } from 'react'
import { getUnitsWithCounts } from '@/helper/units'
import MyUnitsClient from '@/components/page/MyUnitsClient'
import { UnitSkeleton } from '@/components/skeleton/UnitSkeleton'

export default async function MyUnitsPage() {
    const initialUnits = await getUnitsWithCounts();

    return (
        <Suspense fallback={<UnitSkeleton />}>
            <MyUnitsClient initialUnits={initialUnits} />
        </Suspense>
    )
}