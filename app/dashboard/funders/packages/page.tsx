"use client"

import React, { Suspense, useState, useEffect } from 'react'
import { getPackages } from '@/helper/package'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { PackagesTable, PackagesTableSkeleton } from '@/components/tables/packages'

const PackagesPage = () => {
    const [packages, setPackages] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await getPackages()
                setPackages(data)
            } catch (error) {
                console.error("Failed to fetch packages:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchPackages()
    }, [])

    const filteredPackages = packages.filter(pkg => {
        const query = searchQuery.toLowerCase()
        return (
            (pkg.name?.toLowerCase() || "").includes(query) ||
            (pkg.balance?.toString() || "").includes(query) ||
            (pkg.phase?.toString() || "").includes(query) ||
            (pkg.instrument?.toLowerCase() || "").includes(query) ||
            (pkg.funders?.name?.toLowerCase() || "").includes(query)
        )
    })

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="Packages"
                        addButtonText="Add Package"
                        addHref="/dashboard/funders/add-package"
                        showSearch={true}
                        onSearchChange={setSearchQuery}
                    />
                </div>

                {/* Content Section */}
                <div className="px-6 pb-6">
                    {isLoading ? (
                        <PackagesTableSkeleton />
                    ) : (
                        <PackagesTable data={filteredPackages} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default PackagesPage