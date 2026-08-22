"use client"

import React, { Suspense, useState, useEffect } from 'react'
import { getAccounts } from '@/helper/accounts'
import { getUnits } from '@/helper/units'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { AccountsTable, AccountsTableSkeleton } from '@/components/tables/accounts'

import { CreateUserAccountDialog } from '@/components/modal/Create/CreateUserAccountDialog'

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, ChevronRight, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSearchParams } from 'next/navigation'

const UserAccountsContent = () => {
    const searchParams = useSearchParams()
    const initialUnit = searchParams.get('unit') || "all"
    
    const [accounts, setAccounts] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUnit, setSelectedUnit] = useState<string>(initialUnit)
    const [open, setOpen] = useState(false)
    const [activeFranchise, setActiveFranchise] = useState<string | null>(null)
    const [commandSearch, setCommandSearch] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accountsData, unitsData] = await Promise.all([
                    getAccounts(),
                    getUnits()
                ])
                setAccounts(accountsData)
                setUnits(unitsData)
            } catch (error) {
                console.error("Failed to fetch data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredAccounts = accounts.filter(account => {
        const query = searchQuery.toLowerCase()
        const matchesSearch = (
            (account.first_name?.toLowerCase() || "").includes(query) ||
            (account.last_name?.toLowerCase() || "").includes(query) ||
            (account.email?.toLowerCase() || "").includes(query) ||
            (account.units?.unit_name?.toLowerCase() || "").includes(query)
        )
        const matchesUnit = selectedUnit === "all" || account.units?.id === selectedUnit
        return matchesSearch && matchesUnit
    })

    const unitsByFranchise = units.reduce((acc, unit) => {
        const franchiseName = unit.franchise?.name || 'Unassigned';
        if (!acc[franchiseName]) {
            acc[franchiseName] = [];
        }
        acc[franchiseName].push(unit);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="User Accounts"
                        actionComponent={<CreateUserAccountDialog units={units} setAccounts={setAccounts} />}
                        showSearch={true}
                        onSearchChange={setSearchQuery}
                        extraAction={
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-[200px] justify-between bg-[#1a1a1a] border-[#262626] text-white h-10 hover:bg-[#262626] hover:text-white"
                                    >
                                        {selectedUnit === "all"
                                            ? "All Units"
                                            : units.find((u) => u.id === selectedUnit)?.unit_name || "Select Unit..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[250px] p-0 bg-[#1a1a1a] border-[#262626] text-white">
                                    <Command className="bg-[#1a1a1a] text-white">
                                        <CommandInput 
                                            placeholder={activeFranchise ? `Search units in ${activeFranchise}...` : "Search franchises..."} 
                                            className="text-white placeholder:text-gray-400 border-none focus:ring-0 outline-none shadow-none ring-0 focus-visible:ring-0" 
                                            value={commandSearch}
                                            onValueChange={setCommandSearch}
                                        />
                                        <CommandList className="max-h-[300px] overflow-y-auto">
                                            <CommandEmpty>No results found.</CommandEmpty>
                                            
                                            {!activeFranchise ? (
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="all"
                                                        onSelect={() => {
                                                            setSelectedUnit("all");
                                                            setOpen(false);
                                                        }}
                                                        className="text-white aria-selected:bg-[#262626] aria-selected:text-white cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedUnit === "all" ? "opacity-100 text-green-500" : "opacity-0"
                                                            )}
                                                        />
                                                        All Units
                                                    </CommandItem>
                                                    <CommandSeparator className="bg-[#333] my-1" />
                                                    {Object.keys(unitsByFranchise).map(franchise => (
                                                        <CommandItem
                                                            key={franchise}
                                                            value={franchise}
                                                            onSelect={() => {
                                                                setActiveFranchise(franchise);
                                                                setCommandSearch("");
                                                            }}
                                                            className="text-white aria-selected:bg-[#262626] aria-selected:text-white cursor-pointer flex justify-between"
                                                        >
                                                            <span>{franchise}</span>
                                                            <ChevronRight className="h-4 w-4 opacity-50" />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            ) : (
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="back-to-franchises-special-value"
                                                        onSelect={() => {
                                                            setActiveFranchise(null);
                                                            setCommandSearch("");
                                                        }}
                                                        className="text-gray-400 aria-selected:bg-[#262626] aria-selected:text-white cursor-pointer font-medium mb-1"
                                                    >
                                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                                        Back to Franchises
                                                    </CommandItem>
                                                    <CommandSeparator className="bg-[#333] mb-1" />
                                                    {unitsByFranchise[activeFranchise as string]?.map((unit: any) => (
                                                        <CommandItem
                                                            key={unit.id}
                                                            value={unit.unit_name}
                                                            onSelect={() => {
                                                                setSelectedUnit(unit.id);
                                                                setOpen(false);
                                                                setTimeout(() => {
                                                                    setActiveFranchise(null);
                                                                    setCommandSearch("");
                                                                }, 200);
                                                            }}
                                                            className="text-white aria-selected:bg-[#262626] aria-selected:text-white cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedUnit === unit.id ? "opacity-100 text-green-500" : "opacity-0"
                                                                )}
                                                            />
                                                            {unit.unit_name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        }
                    />
                </div>

                {/* Content Section */}
                <div className="px-6 pb-6">
                    {isLoading ? (
                        <AccountsTableSkeleton />
                    ) : (
                        <AccountsTable data={filteredAccounts} units={units} setAccounts={setAccounts} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default function UserAccountsPage() {
    return (
        <Suspense fallback={<AccountsTableSkeleton />}>
            <UserAccountsContent />
        </Suspense>
    )
}
