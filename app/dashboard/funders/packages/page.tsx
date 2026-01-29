"use client"

import React, { Suspense, useState, useEffect } from 'react'
import { getPackages } from '@/helper/package'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { PackagesTable, PackagesTableSkeleton } from '@/components/tables/packages'
import { PackageModal } from '@/components/modal/PackageModal'
import { getFunders } from '@/helper/funders'

const PackagesPage = () => {
    const [packages, setPackages] = useState<any[]>([])
    const [funders, setFunders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedPackage, setSelectedPackage] = useState<any | null>(null)

    const fetchData = async (silent = false) => {
        if (!silent) setIsLoading(true)
        try {
            const [packagesData, fundersData] = await Promise.all([
                getPackages(),
                getFunders()
            ])
            setPackages(packagesData)
            setFunders(fundersData)
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
        fetchData(true) // Refresh silently
    }

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
                        // addHref="/dashboard/funders/add-package" // Removed
                        onAddClick={handleAddClick}
                        showSearch={true}
                        onSearchChange={setSearchQuery}
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
            />
        </div>
    )
}

export default PackagesPage