import React, { Suspense } from 'react'
import { getFunderById } from '@/helper/funders'
import { FunderForm } from '@/components/form/FunderForm'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Separate component for data fetching and logic that uses searchParams
const FunderFormContent = async ({ searchParamsPromise }: { searchParamsPromise: PageProps['searchParams'] }) => {
    const searchParams = await searchParamsPromise
    const funderId = searchParams.id ? Number(searchParams.id) : null
    const isUpdate = !!funderId

    let initialData = null
    if (funderId) {
        initialData = await getFunderById(funderId)
    }

    return (
        <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden max-w-2xl ">
            {/* Header Section */}
            <div className="px-6 pt-6 pb-6 border-b border-[#1a1a1a] flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold text-white">
                        {isUpdate ? 'Update Funder' : 'Add New Funder'}
                    </h1>
                </div>
            </div>

            {/* Form Section */}
            <div className="p-6">
                <FunderForm key={funderId || 'new'} initialData={initialData} />
            </div>
        </div>
    )
}

// Loading skeleton component
const FormSkeleton = () => (
    <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden max-w-2xl">
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
                <FunderFormContent searchParamsPromise={searchParams} />
            </Suspense>
        </div>
    )
}

export default Page
