"use client"

import React, { useState } from 'react'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { FundersTable } from '@/components/tables/funders'
import { FunderModal } from '@/components/modal/FunderModal'
import { FunderSuggestionModal } from '@/components/modal/FunderSuggestionModal'
import { Funder } from '@/types/funder'

interface FundersClientProps {
    initialFunders: Funder[]
    isSuperAdmin: boolean
}

export default function FundersClient({ initialFunders, isSuperAdmin }: FundersClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false)
    const [selectedFunder, setSelectedFunder] = useState<any | null>(null)

    const handleAddClick = () => {
        if (isSuperAdmin) {
            setSelectedFunder(null)
            setIsModalOpen(true)
        } else {
            setIsSuggestionModalOpen(true)
        }
    }

    const handleEditClick = (funder: any) => {
        if (isSuperAdmin) {
            setSelectedFunder(funder)
            setIsModalOpen(true)
        }
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedFunder(null)
    }

    const handleModalSuccess = () => {
        setIsModalOpen(false)
        setSelectedFunder(null)
    }

    const handleSuggestionModalSuccess = () => {
        setIsSuggestionModalOpen(false)
    }

    const filteredFunders = initialFunders.filter(funder => {
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
                        addButtonText={isSuperAdmin ? "Add Funder" : "Suggest Funder"}
                        onAddClick={handleAddClick}
                        showSearch={true}
                        onSearchChange={setSearchQuery}
                    />
                </div>

                {/* Content Section */}
                <div className="px-6 pb-6">
                    <FundersTable
                        data={filteredFunders}
                        onEdit={isSuperAdmin ? handleEditClick : undefined}
                        isSuperAdmin={isSuperAdmin}
                    />
                </div>
            </div>

            <FunderModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                initialData={selectedFunder}
            />

            <FunderSuggestionModal 
                isOpen={isSuggestionModalOpen} 
                onClose={() => setIsSuggestionModalOpen(false)}
                onSuccess={handleSuggestionModalSuccess}
            />
        </div>
    )
}
