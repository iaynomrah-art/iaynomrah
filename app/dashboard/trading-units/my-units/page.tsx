import React, { Suspense } from 'react'
import { getUnitsWithCounts } from '@/helper/units'
import { getFranchises } from '@/helper/franchise'
import MyUnitsClient from '@/components/page/MyUnitsClient'
import { UnitSkeleton } from '@/components/skeleton/UnitSkeleton'
import { createClient } from '@/lib/supabase/server'

export default async function MyUnitsPage() {
    const supabase = await createClient();
    const [initialUnits, { data: { user } }, franchises] = await Promise.all([
        getUnitsWithCounts(),
        supabase.auth.getUser(),
        getFranchises()
    ]);

    const role = user?.app_metadata?.role || null;

    return (
        <Suspense fallback={<UnitSkeleton />}>
            <MyUnitsClient 
                initialUnits={initialUnits} 
                role={role} 
                franchises={franchises}
            />
        </Suspense>
    )
}