'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { FunderAccountsForm } from '@/components/form/FunderAccountsForm'
import { useRouter } from 'next/navigation'

interface EditFunderAccountDialogProps {
    funderAccount: any
    packages: any[]
    accounts: any[]
    units: any[]
    funders: any[]
}

export const EditFunderAccountDialog = ({
    funderAccount,
    packages,
    accounts,
    units,
    funders
}: EditFunderAccountDialogProps) => {
    const [open, setOpen] = useState(false)
    const router = useRouter()

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
                    <FunderAccountsForm
                        initialData={funderAccount}
                        packages={packages}
                        accounts={accounts}
                        units={units}
                        funders={funders}
                        onSuccess={handleSuccess}
                        onCancel={() => setOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
