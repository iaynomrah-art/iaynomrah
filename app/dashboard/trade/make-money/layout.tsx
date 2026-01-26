"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
    { id: 'trading-accounts', label: 'Trading Accounts', href: '/dashboard/trade/make-money' },
    { id: 'paired-accounts', label: 'Paired Accounts', href: '/dashboard/trade/make-money/paired-accounts' },
    { id: 'ongoing-trades', label: 'Ongoing Trades', href: '/dashboard/trade/make-money/ongoing-trades' },
]

export default function MakeMoneyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-[#050505] p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Tab Navigation */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#1a1a1a] p-1 rounded-xl w-fit">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href
                            return (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className={cn(
                                        "px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                        isActive
                                            ? "bg-[#1a1a1a] text-white shadow-lg shadow-black/50"
                                            : "text-muted-foreground hover:text-white hover:bg-[#111]"
                                    )}
                                >
                                    {tab.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Content Container */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 lg:p-8 shadow-2xl overflow-hidden min-h-[600px]">
                        {children}
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
