import React from 'react'
import { UserAccountsForm } from '@/components/form/UserAccountsForm'

import { getAccountById } from '@/helper/accounts'

interface PageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

const AddUserAccountPage = async ({ searchParams }: PageProps) => {
    const id = searchParams?.id ? parseInt(searchParams.id as string) : null
    const initialData = id ? await getAccountById(id) : null

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden max-w-2xl">
                {/* Form Section */}
                <div className="p-6">
                    <UserAccountsForm initialData={initialData} />
                </div>
            </div>
        </div>
    )
}

export default AddUserAccountPage
