import React, { Suspense } from 'react'
import { getFunderAccounts } from '@/helper/funder_accounts'
import { getFranchises } from '@/helper/franchise'

export const dynamic = 'force-dynamic'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { FunderAccountsTable } from '@/components/tables/funder_accounts'
import { FunderAccountsTableSkeleton } from '@/components/skeleton/FunderAccountsTableSkeleton'
import { CreateFunderAccountDialog } from '@/components/modal/Create/AddFunderAccount'

const FunderAccountsList = async () => {
    const data = await getFunderAccounts();
    const franchisesData = await getFranchises();

    return (
        <div className="px-6 pb-6">
            <FunderAccountsTable
                data={data}
                franchises={franchisesData}
            />
        </div>
    );
};

const Page = async () => {
    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="Funder Accounts"
                        actionComponent={
                            <CreateFunderAccountDialog />
                        }
                    />
                </div>

                <Suspense fallback={
                    <div className="px-6 pb-6">
                        <FunderAccountsTableSkeleton />
                    </div>
                }>
                    <FunderAccountsList />
                </Suspense>
            </div>
        </div>
    )
}

export default Page