'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { FunderAccountsForm } from '@/components/form/FunderAccountsForm'
import { useRouter } from 'next/navigation'

interface CreateFunderAccountDialogProps {
    packages: any[]
    accounts: any[]
    units: any[]
    funders: any[]
}

export const CreateFunderAccountDialog = ({
    packages,
    accounts,
    units,
    funders
}: CreateFunderAccountDialogProps) => {
    const [open, setOpen] = useState(false)
    const router = useRouter()

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
                    <FunderAccountsForm
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