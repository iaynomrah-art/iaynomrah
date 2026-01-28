import React from 'react'
import { FranchiseForm } from '@/components/form/FranchiseForm'

const AddFranchisePage = () => {
    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden max-w-2xl">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-6 border-b border-[#1a1a1a]">
                    <h1 className="text-xl font-semibold text-white">Add New Franchise</h1>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    <FranchiseForm />
                </div>
            </div>
        </div>
    )
}

export default AddFranchisePage
