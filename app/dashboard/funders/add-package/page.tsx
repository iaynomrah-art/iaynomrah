import React, { Suspense } from 'react'
import { getPackageById } from '@/helper/package'
import { getFunders } from '@/helper/funders'
import { PackageForm } from '@/components/form/PackageForm'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Separate component for data fetching and logic that uses searchParams
const PackageFormContent = async ({ searchParamsPromise }: { searchParamsPromise: PageProps['searchParams'] }) => {
    const searchParams = await searchParamsPromise
    const packageId = searchParams.id ? Number(searchParams.id) : null
    const isUpdate = !!packageId

    // Fetch data in parallel
    const [initialData, funders] = await Promise.all([
        packageId ? getPackageById(packageId) : Promise.resolve(null),
        getFunders()
    ])

    return (
        <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden max-w-md ">
            {/* Header Section */}
            <div className="px-6 pt-6 pb-6 border-b border-[#1a1a1a] flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold text-white">
                        {isUpdate ? 'Update Package' : 'Add New Package'}
                    </h1>
                </div>
            </div>

            {/* Form Section */}
            <div className="p-6">
                <PackageForm key={packageId || 'new'} initialData={initialData} funders={funders} />
            </div>
        </div>
    )
}

// Loading skeleton component
const FormSkeleton = () => (
    <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden max-w-md">
        <div className="px-6 pt-6 pb-6 border-b border-[#1a1a1a]">
            <Skeleton className="h-7 w-48 bg-[#1a1a1a]" />
        </div>
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-[#1a1a1a]" />
                <Skeleton className="h-10 w-full bg-[#1a1a1a]" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-[#1a1a1a]" />
                <Skeleton className="h-10 w-full bg-[#1a1a1a]" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-[#1a1a1a]" />
                <Skeleton className="h-10 w-full bg-[#1a1a1a]" />
            </div>
            <Skeleton className="h-10 w-32 bg-[#1a1a1a]" />
        </div>
    </div>
)

const Page = ({ searchParams }: PageProps) => {
    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <Suspense fallback={<FormSkeleton />}>
                <PackageFormContent searchParamsPromise={searchParams} />
            </Suspense>
        </div>
    )
}

export default Page