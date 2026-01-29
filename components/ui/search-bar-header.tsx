"use client"

import * as React from "react"
import { ChevronDown, Plus, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchBarHeaderProps {
    title: string
    placeholder?: string
    addButtonText?: string
    filterButtonText?: string
    showFilter?: boolean
    showSearch?: boolean
    onAddClick?: () => void
    addHref?: string
    onSearchChange?: (value: string) => void
    onFilterClick?: () => void
    extraAction?: React.ReactNode
    className?: string
    searchAtEnd?: boolean
    // 1. ADD THIS PROP HERE
    actionComponent?: React.ReactNode
}

export function SearchBarHeader({
    title,
    placeholder = "Search all fields...",
    addButtonText,
    filterButtonText = "All",
    showFilter = false,
    showSearch = true,
    onAddClick,
    addHref,
    onSearchChange,
    onFilterClick,
    extraAction,
    className,
    searchAtEnd = false,
    // 2. DESTRUCTURE IT HERE
    actionComponent
}: SearchBarHeaderProps) {
    return (
        <div className={cn("flex flex-wrap items-center justify-between w-full py-2 gap-4", className)}>
            <h1 suppressHydrationWarning className="text-xl md:text-2xl font-semibold tracking-tight text-white">{title}</h1>

            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
                {/* Search Group */}
                {(showFilter || showSearch) && (
                    <div className={cn(
                        "flex items-center group shadow-sm bg-[#1F2937] rounded-md overflow-hidden border border-[#262626] focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all",
                        searchAtEnd ? "order-last" : "order-first"
                    )}>
                        {showFilter && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onFilterClick}
                                className="h-10 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 gap-2 border-r border-blue-700/30 transition-all border-none"
                            >
                                {filterButtonText}
                                <ChevronDown className="h-4 w-4 opacity-70" />
                            </Button>
                        )}

                        {showSearch && (
                            <div className="relative flex items-center">
                                <Search className="absolute left-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder={placeholder}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    className="h-10 w-[200px] sm:w-[280px] md:w-[320px] pl-10 border-none bg-transparent text-sm text-white focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40 transition-all"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Extra Action (e.g. Phases) */}
                {extraAction}

                {/* 3. UPDATED LOGIC HERE: 
                    If actionComponent is passed (Modal), render that.
                    Otherwise, fall back to the standard Link or Button logic.
                */}
                {actionComponent ? (
                    actionComponent
                ) : (
                    addButtonText && (
                        addHref ? (
                            <Link href={addHref}>
                                <Button
                                    onClick={onAddClick}
                                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 gap-2 shadow-lg shadow-blue-900/10 transition-all active:scale-95"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">{addButtonText}</span>
                                    <span className="sm:hidden">Add</span>
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                onClick={onAddClick}
                                className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 gap-2 shadow-lg shadow-blue-900/10 transition-all active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">{addButtonText}</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        )
                    )
                )}
            </div>
        </div>
    )
}