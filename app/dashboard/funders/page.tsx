"use client"

import React, { Suspense, useState, useEffect } from 'react'
import { getFunders } from '@/helper/funders'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { FundersTable } from '@/components/tables/funders'
import { FundersTableSkeleton } from '@/components/skeleton/FundersTableSkeleton'

const FundersPage = () => {
    const [funders, setFunders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchFunders = async () => {
            try {
                const data = await getFunders()
                setFunders(data)
            } catch (error) {
                console.error("Failed to fetch funders:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchFunders()
    }, [])

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
                        addHref="/dashboard/funders/add-funder"
                        showSearch={true}
                        onSearchChange={setSearchQuery}
                    />
                </div>

                {/* Content Section */}
                <div className="px-6 pb-6">
                    {isLoading ? (
                        <FundersTableSkeleton />
                    ) : (
                        <FundersTable data={filteredFunders} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default FundersPage