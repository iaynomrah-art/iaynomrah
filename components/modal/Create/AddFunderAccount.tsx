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
import { getUnits } from '@/helper/units'
import { getFunders } from '@/helper/funders'

export const CreateFunderAccountDialog = () => {
    const [open, setOpen] = useState(false)
    const [packages, setPackages] = useState<Package[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [units, setUnits] = useState<Unit[]>([])
    const [funders, setFunders] = useState<Funder[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const fetchOptions = async () => {
            if (open) {
                setIsLoading(true)
                try {
                    const [pkgs, accs, us, fnds] = await Promise.all([
                        getPackages(),
                        getAccounts(),
                        getUnits(),
                        getFunders()
                    ])
                    setPackages(pkgs)
                    setAccounts(accs)
                    setUnits(us)
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
                setUnits([])
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
                        <div className="flex justify-center p-8 text-muted-foreground">Loading options...</div>
                    ) : (
                        <FunderAccountsForm
                            packages={packages}
                            accounts={accounts}
                            units={units}
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