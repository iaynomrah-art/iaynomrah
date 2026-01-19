"use client"

import React from 'react'

const OngoingTradesPage = () => {
    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-white">Ongoing Trades</h2>
                <p className="text-sm text-muted-foreground">Monitor real-time trade activity across your accounts.</p>
            </div>

            <div className="mt-12 flex flex-col items-center justify-center p-12 border border-dashed border-[#1a1a1a] rounded-xl bg-[#0a0a0a]/50">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                </div>
                <h3 className="text-lg font-medium text-white">No active trades</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs mt-1">
                    When trades are active on your accounts, they will appear here in real-time.
                </p>
            </div>
        </div>
    )
}

export default OngoingTradesPage
