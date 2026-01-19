import React, { Suspense } from 'react'
import { getPackages } from '@/helper/package'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { PackagesTable, PackagesTableSkeleton } from '@/components/tables/packages'
import { Button } from '@/components/ui/button'
import { Layers } from 'lucide-react'
import Link from 'next/link'

const PackagesList = async () => {
    const data = await getPackages();
    return (
        <div className="px-6 pb-6">
            <PackagesTable data={data} />
        </div>
    );
};

const page = () => {
    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header Section */}
                <Link href="/dashboard/funders/add-package" className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="Packages"
                        addButtonText="Add Package"
                        showSearch={false}
                    />
                </Link>

                {/* Content Section */}
                <Suspense fallback={
                    <div className="px-6 pb-6">
                        <PackagesTableSkeleton />
                    </div>
                }>
                    <PackagesList />
                </Suspense>
            </div>
        </div>
    )
}

export default page