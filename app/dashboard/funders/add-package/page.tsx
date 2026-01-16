import React from 'react'
import { getPackageById } from '@/helper/package'
import { getFunders } from '@/helper/funders'
import { PackageForm } from '@/components/form/PackageForm'

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const page = async ({ searchParams }: PageProps) => {
    const params = await searchParams
    const packageId = params.id ? Number(params.id) : null

    // Fetch data in parallel
    const [initialData, funders] = await Promise.all([
        packageId ? getPackageById(packageId) : Promise.resolve(null),
        getFunders()
    ])

    const isUpdate = !!packageId

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
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
        </div>
    )
}

export default page