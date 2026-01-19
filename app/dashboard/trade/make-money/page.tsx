"use client"

import React, { useState } from 'react'
import TradingAccountsPage from '@/components/make-money/trading-accounts/page'
import OngoingTradesPage from '@/components/make-money/ongoing-trades/page'
import PairedAccountsPage from '@/components/make-money/paired-accounts/page'
import { cn, tabs } from '@/lib/utils'

const Page = () => {
    const [activeTab, setActiveTab] = useState('trading-accounts')

    return (
        <div className="min-h-screen bg-[#050505] p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Tab Navigation */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#1a1a1a] p-1 rounded-xl w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                    activeTab === tab.id
                                        ? "bg-[#1a1a1a] text-white shadow-lg shadow-black/50"
                                        : "text-muted-foreground hover:text-white hover:bg-[#111]"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content Container */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 lg:p-8 shadow-2xl overflow-hidden min-h-[600px]">
                        {activeTab === 'trading-accounts' && <TradingAccountsPage />}
                        {activeTab === 'paired-accounts' && <PairedAccountsPage />}
                        {activeTab === 'ongoing-trades' && <OngoingTradesPage />}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes slide-up {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    )
}

export default Page