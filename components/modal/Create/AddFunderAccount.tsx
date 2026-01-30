'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { FunderAccountsForm } from '@/components/form/FunderAccountsForm'
import { useRouter } from 'next/navigation'
import { Package } from '@/types/package'
import { Account } from '@/types/accounts'
import { Unit } from '@/types/units'
import { Funder } from '@/types/funder'

import { getPackages } from '@/helper/package'
import { getAccounts } from '@/helper/accounts'
import { getFunders } from '@/helper/funders'
import { Skeleton } from '@/components/ui/skeleton';

export const CreateFunderAccountDialog = () => {
    const [open, setOpen] = useState(false)
    const [packages, setPackages] = useState<Package[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [funders, setFunders] = useState<Funder[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const fetchOptions = async () => {
            if (open) {
                setIsLoading(true)
                try {
                    const [pkgs, accs, fnds] = await Promise.all([
                        getPackages(),
                        getAccounts(),
                        getFunders()
                    ])
                    setPackages(pkgs)
                    setAccounts(accs)
                    setFunders(fnds)
                } catch (error) {
                    console.error("Failed to fetch options", error)
                } finally {
                    setIsLoading(false)
                }
            } else {
                // Clear data when dialog closes
                setPackages([])
                setAccounts([])
                setFunders([])
            }
        }
        fetchOptions()
    }, [open])

    const handleSuccess = () => {
        setOpen(false)
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 gap-2 shadow-lg shadow-blue-900/10 transition-all active:scale-95">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Funder Account</span>
                    <span className="sm:hidden">Add</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl bg-[#0a0a0a] border-[#1a1a1a] text-white">
                <DialogHeader>
                    <DialogTitle>Add Funder Account</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    {isLoading ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20 bg-[#1a1a1a]" />
                                <Skeleton className="h-11 w-full bg-[#1a1a1a]" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20 bg-[#1a1a1a]" />
                                <Skeleton className="h-11 w-full bg-[#1a1a1a]" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20 bg-[#1a1a1a]" />
                                <Skeleton className="h-11 w-full bg-[#1a1a1a]" />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-[#1a1a1a]">
                                <Skeleton className="h-10 w-24 bg-[#1a1a1a]" />
                                <Skeleton className="h-10 w-32 bg-[#1a1a1a]" />
                            </div>
                        </div>
                    ) : (
                        <FunderAccountsForm
                            packages={packages}
                            accounts={accounts}
                            funders={funders}
                            onSuccess={handleSuccess}
                            onCancel={() => setOpen(false)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}