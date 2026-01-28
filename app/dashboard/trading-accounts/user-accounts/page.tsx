"use client"

import React, { Suspense, useState, useEffect } from 'react'
import { getAccounts } from '@/helper/accounts'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { AccountsTable, AccountsTableSkeleton } from '@/components/tables/accounts'

const UserAccountsPage = () => {
    const [accounts, setAccounts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await getAccounts()
                setAccounts(data)
            } catch (error) {
                console.error("Failed to fetch accounts:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchAccounts()
    }, [])

    const filteredAccounts = accounts.filter(account => {
        const query = searchQuery.toLowerCase()
        return (
            (account.first_name?.toLowerCase() || "").includes(query) ||
            (account.last_name?.toLowerCase() || "").includes(query) ||
            (account.email?.toLowerCase() || "").includes(query) ||
            (account.server_unit?.toLowerCase() || "").includes(query)
        )
    })

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="User Accounts"
                        addButtonText="Add User Account"
                        addHref="/dashboard/trading-accounts/user-accounts/add-user-account"
                        showSearch={true}
                        onSearchChange={setSearchQuery}
                    />
                </div>

                {/* Content Section */}
                <div className="px-6 pb-6">
                    {isLoading ? (
                        <AccountsTableSkeleton />
                    ) : (
                        <AccountsTable data={filteredAccounts} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserAccountsPage
