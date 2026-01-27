import React from 'react'
import { FunderAccountsForm } from '@/components/form/FunderAccountsForm'
import { getPackages } from '@/helper/package'
import { getAccounts } from '@/helper/accounts'
import { getUnits } from '@/helper/units'
import { getFunders } from '@/helper/funders'
import { getFunderAccountById } from '@/helper/funder_accounts'

interface PageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

const AddFunderAccountPage = async ({ searchParams }: PageProps) => {
    // Parallel data fetching for efficiency
    const [packages, accounts, units, funders] = await Promise.all([
        getPackages(),
        getAccounts(),
        getUnits(),
        getFunders()
    ])

    const id = searchParams?.id ? parseInt(searchParams.id as string) : null
    const initialData = id ? await getFunderAccountById(id) : null

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden max-w-2xl">
                {/* Form Section */}
                <div className="p-8">
                    <FunderAccountsForm
                        initialData={initialData}
                        packages={packages}
                        accounts={accounts}
                        units={units}
                        funders={funders}
                    />
                </div>
            </div>
        </div>
    )
}

export default AddFunderAccountPage
