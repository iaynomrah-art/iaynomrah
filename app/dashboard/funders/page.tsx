"use client"

import React, { Suspense, useState, useEffect } from 'react'
import { getFunders } from '@/helper/funders'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { FundersTable } from '@/components/tables/funders'
import { FundersTableSkeleton } from '@/components/skeleton/FundersTableSkeleton'
import { FunderModal } from '@/components/modal/FunderModal'

const FundersPage = () => {
    const [funders, setFunders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedFunder, setSelectedFunder] = useState<any | null>(null)

    const fetchFunders = async () => {
        setIsLoading(true)
        try {
            const data = await getFunders()
            setFunders(data)
        } catch (error) {
            console.error("Failed to fetch funders:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFunders()
    }, [])

    const handleAddClick = () => {
        setSelectedFunder(null)
        setIsModalOpen(true)
    }

    const handleEditClick = (funder: any) => {
        setSelectedFunder(funder)
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedFunder(null)
        fetchFunders() // Refetch data to update list
    }

    const filteredFunders = funders.filter(funder => {
        const query = searchQuery.toLowerCase()
        return (
            (funder.name?.toLowerCase() || "").includes(query) ||
            (funder.allias?.toLowerCase() || "").includes(query)
        )
    })

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden ">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="Funders"
                        addButtonText="Add Funder"
                        // addHref="/dashboard/funders/add-funder" // Removed
                        onAddClick={handleAddClick}
                        showSearch={true}
                        onSearchChange={setSearchQuery}
                    />
                </div>

                {/* Content Section */}
                <div className="px-6 pb-6">
                    {isLoading ? (
                        <FundersTableSkeleton />
                    ) : (
                        <FundersTable
                            data={filteredFunders}
                            onEdit={handleEditClick}
                        />
                    )}
                </div>
            </div>

            <FunderModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                initialData={selectedFunder}
            />
        </div>
    )
}

export default FundersPage