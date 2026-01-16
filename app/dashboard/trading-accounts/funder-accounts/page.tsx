import React, { Suspense } from 'react'
import { getFunderAccounts } from '@/helper/funder_accounts'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { FunderAccountsTable, FunderAccountsTableSkeleton } from '@/components/tables/funder_accounts'

const FunderAccountsList = async () => {
    const data = await getFunderAccounts();

    return (
        <div className="px-6 pb-6">
            <FunderAccountsTable data={data} />
        </div>
    );
};

const page = () => {
    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505]">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="Funder Accounts"
                        addButtonText="Add Funder Account"
                    />
                </div>

                {/* Content Section */}
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

export default page