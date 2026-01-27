import React, { Suspense } from 'react'
import { getAccounts } from '@/helper/accounts'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { AccountsTable, AccountsTableSkeleton } from '@/components/tables/accounts'
import Link from 'next/link'

const AccountsList = async () => {
    const accounts = await getAccounts();
    return (
        <div className="px-6 pb-6">
            <AccountsTable data={accounts} />
        </div>
    );
};

const UserAccountsPage = () => {
    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header Section */}
                <Link href="/dashboard/trading-accounts/user-accounts/add-user-account" className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="User Accounts"
                        addButtonText="Add User Account"
                        showSearch={false}
                    />
                </Link>

                {/* Content Section */}
                <Suspense fallback={
                    <div className="px-6 pb-6">
                        <AccountsTableSkeleton />
                    </div>
                }>
                    <AccountsList />
                </Suspense>
            </div>
        </div>
    )
}

export default UserAccountsPage
