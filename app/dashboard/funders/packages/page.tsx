"use client"

import React, { Suspense, useState, useEffect } from 'react'
import { getPackages } from '@/helper/package'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { PackagesTable, PackagesTableSkeleton } from '@/components/tables/packages'
import { PackageModal } from '@/components/modal/PackageModal'
import { getFunders } from '@/helper/funders'
import { getCredentials } from '@/helper/credentials'
import { getAccounts } from '@/helper/accounts'
import { ChevronDown } from 'lucide-react'

// Packages management page: lists packages and opens add/update modal.
const PackagesPage = () => {
    const [packages, setPackages] = useState<any[]>([])
    const [funders, setFunders] = useState<any[]>([])
    const [credentials, setCredentials] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedPackage, setSelectedPackage] = useState<any | null>(null)

    const fetchData = async (silent = false) => {
        if (!silent) setIsLoading(true)
        try {
            const [packagesData, fundersData, credentialsData, accountsData] = await Promise.all([
                getPackages(),
                getFunders(),
                getCredentials(),
                getAccounts()
            ])
            setPackages(packagesData)
            setFunders(fundersData)
            setCredentials(credentialsData)
            setAccounts(accountsData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            if (!silent) setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleAddClick = () => {
        setSelectedPackage(null)
        setIsModalOpen(true)
    }

    const handleEditClick = (pkg: any) => {
        setSelectedPackage(pkg)
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedPackage(null)
    }

    const handleModalSuccess = () => {
        setIsModalOpen(false)
        setSelectedPackage(null)
        // Re-fetch silently so table updates after create/update without showing skeleton.
        fetchData(true) // Refresh silently
    }

    const filteredPackages = packages.filter(pkg => {
        const query = searchQuery.toLowerCase()
        const matchesSearch = (
            (pkg.name?.toLowerCase() || "").includes(query) ||
            (pkg.balance?.toString() || "").includes(query) ||
            (pkg.phase?.toString() || "").includes(query) ||
            (pkg.instrument?.toLowerCase() || "").includes(query) ||
            (pkg.max_daily_loss?.toString() || "").includes(query) ||
            (pkg.max_total_loss?.toString() || "").includes(query) ||
            (pkg.profit_target?.toString() || "").includes(query) ||
            (pkg.purchase_price?.toString() || "").includes(query) ||
            (pkg.funders?.name?.toLowerCase() || "").includes(query)
        )
        const matchesAccount = selectedAccountId ? pkg.account_id === selectedAccountId : true;
        
        return matchesSearch && matchesAccount;
    })

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="Packages"
                        addButtonText="Add Package"
                        onAddClick={handleAddClick}
                        showSearch={true}
                        onSearchChange={setSearchQuery}
                        extraAction={
                            <div className="relative">
                                <select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    className="h-10 rounded-md border border-[#262626] bg-[#1F2937] text-white px-3 py-1 text-sm appearance-none focus:border-blue-500 transition-all min-w-[150px] pr-8"
                                >
                                    <option value="">All Accounts</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.first_name} {acc.last_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        }
                    />
                </div>

                {/* Content Section */}
                <div className="px-6 pb-6">
                    {isLoading ? (
                        <PackagesTableSkeleton />
                    ) : (
                        <PackagesTable
                            data={filteredPackages}
                            onEdit={handleEditClick}
                            onDeleteSuccess={() => fetchData(true)}
                        />
                    )}
                </div>
            </div>

            <PackageModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                initialData={selectedPackage}
                funders={funders}
                credentials={credentials}
            />
        </div>
    )
}

export default PackagesPage