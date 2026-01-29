import React, { Suspense } from 'react'
import { getFunderAccounts } from '@/helper/funder_accounts'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { FunderAccountsTable } from '@/components/tables/funder_accounts'
import { getPackages } from '@/helper/package'
import { getAccounts } from '@/helper/accounts'
import { getUnits } from '@/helper/units'
import { getFunders } from '@/helper/funders'
import { FunderAccountsTableSkeleton } from '@/components/skeleton/FunderAccountsTableSkeleton'
import { CreateFunderAccountDialog } from '@/components/modal/Create/AddFunderAccount'
import { Package } from '@/types/package'
import { Account } from '@/types/accounts'
import { Unit } from '@/types/units'
import { Funder } from '@/types/funder'

interface FunderAccountsListProps {
    packages: Package[]
    accounts: Account[]
    units: Unit[]
    funders: Funder[]
}

const FunderAccountsList = async ({ packages, accounts, units, funders }: FunderAccountsListProps) => {
    const data = await getFunderAccounts();

    return (
        <div className="px-6 pb-6">
            <FunderAccountsTable
                data={data}
                packages={packages}
                accounts={accounts}
                units={units}
                funders={funders}
            />
        </div>
    );
};

const Page = async () => {
    const [packages, accounts, units, funders] = await Promise.all([
        getPackages(),
        getAccounts(),
        getUnits(),
        getFunders(),
    ])

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="Funder Accounts"
                        actionComponent={
                            <CreateFunderAccountDialog
                                packages={packages}
                                accounts={accounts}
                                units={units}
                                funders={funders}
                            />
                        }
                    />
                </div>

                <Suspense fallback={
                    <div className="px-6 pb-6">
                        <FunderAccountsTableSkeleton />
                    </div>
                }>
                    <FunderAccountsList
                        packages={packages}
                        accounts={accounts}
                        units={units}
                        funders={funders}
                    />
                </Suspense>
            </div>
        </div>
    )
}

export default Page