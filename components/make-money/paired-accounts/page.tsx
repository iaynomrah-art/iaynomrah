"use client"

import React from 'react'

const PairedAccountsPage = () => {
    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-white">Paired Accounts</h2>
                <p className="text-sm text-muted-foreground">Manage relationships between your parent and child accounts.</p>
            </div>

            <div className="mt-12 flex flex-col items-center justify-center p-12 border border-dashed border-[#1a1a1a] rounded-xl bg-[#0a0a0a]/50">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M21 16v5h-5" /><path d="M3 16v5h5" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                </div>
                <h3 className="text-lg font-medium text-white">No paired accounts</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs mt-1">
                    Pair your accounts to synchronise trading signals across multiple units.
                </p>
                <button className="mt-6 px-4 py-2 bg-[#1a1a1a] hover:bg-[#262626] text-white text-sm font-medium rounded-lg transition-colors border border-[#333]">
                    Pair Evolution Account
                </button>
            </div>
        </div>
    )
}

export default PairedAccountsPage
