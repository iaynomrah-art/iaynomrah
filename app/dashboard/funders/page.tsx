import React, { Suspense } from 'react'
import { getFunders } from '@/helper/funders'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { FundersTable } from '@/components/tables/funders'
import { FundersTableSkeleton } from '@/components/skeleton/FundersTableSkeleton'
import Link from 'next/link'

const FundersList = async () => {
    const data = await getFunders();
    return (
        <div className="px-6 pb-6">
            <FundersTable data={data} />
        </div>
    );
};

const page = () => {

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden ">
                {/* Header Section */}
                <Link href="/dashboard/funders/add-funder" className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="Funders"
                        addButtonText="Add Funder"
                        showSearch={false}
                    />
                </Link >

                {/* Content Section */}
                <Suspense fallback={
                    <div className="px-6 pb-6">
                        <FundersTableSkeleton />
                    </div>
                }>
                    <FundersList />
                </Suspense>
            </div>
        </div>
    )
}

export default page