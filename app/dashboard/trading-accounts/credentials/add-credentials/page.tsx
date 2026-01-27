import React from 'react'
import { AccountCredentialsForm } from '@/components/form/AccountCredentialsForm'
import { getFunders } from '@/helper/funders'
import { getCredentialById } from '@/helper/credentials'

interface PageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

const AddCredentialsPage = async ({ searchParams }: PageProps) => {
    // Parallel fetching for performance
    const [funders] = await Promise.all([
        getFunders()
    ])

    const id = searchParams?.id ? parseInt(searchParams.id as string) : null
    const initialData = id ? await getCredentialById(id) : null

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden max-w-2xl">
                <div className="p-8">
                    <AccountCredentialsForm
                        initialData={initialData}
                        funders={funders}
                    />
                </div>
            </div>
        </div>
    )
}

export default AddCredentialsPage
