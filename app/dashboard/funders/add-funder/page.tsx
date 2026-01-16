import React from 'react'
import { getFunderById } from '@/helper/funders'
import { FunderForm } from '@/components/form/FunderForm'

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const page = async ({ searchParams }: PageProps) => {
    const params = await searchParams
    const funderId = params.id ? Number(params.id) : null

    let initialData = null
    if (funderId) {
        initialData = await getFunderById(funderId)
    }

    const isUpdate = !!funderId

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
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
                    <FunderForm initialData={initialData} />
                </div>
            </div>
        </div>
    )
}

export default page
