'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { FunderAccountsForm } from '@/components/form/FunderAccountsForm'
import { useRouter } from 'next/navigation'
import { FunderAccount } from '@/types/funder_accounts'
import { Package } from '@/types/package'
import { Account } from '@/types/accounts'
import { Unit } from '@/types/units'
import { Funder } from '@/types/funder'

import { getPackages } from '@/helper/package'
import { getAccounts } from '@/helper/accounts'
import { getFunders } from '@/helper/funders'
import { Skeleton } from '@/components/ui/skeleton';

interface EditFunderAccountDialogProps {
    funderAccount: FunderAccount
}

export const EditFunderAccountDialog = ({
    funderAccount
}: EditFunderAccountDialogProps) => {
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
                <div
                    className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-[#262626] text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                    <Pencil className="h-4 w-4" />
                </div>
            </DialogTrigger>

            <DialogContent className="max-w-2xl bg-[#0a0a0a] border-[#1a1a1a] text-white">
                <DialogHeader>
                    <DialogTitle>Edit Funder Account</DialogTitle>
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
                            initialData={funderAccount}
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
