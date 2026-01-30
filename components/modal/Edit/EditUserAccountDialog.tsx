'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import { UserAccountsForm } from '@/components/form/UserAccountsForm'
import { useRouter } from 'next/navigation'

interface EditUserAccountDialogProps {
    account: any
    units?: any[]
    setAccounts: React.Dispatch<React.SetStateAction<any[]>>
}

export const EditUserAccountDialog = ({ account, units = [], setAccounts }: EditUserAccountDialogProps) => {
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

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-[#1a1a1a] text-white">
                <DialogHeader>
                    <DialogTitle>Edit User Account</DialogTitle>
                </DialogHeader>

                <UserAccountsForm
                    initialData={account}
                    units={units}
                    setAccounts={setAccounts}
                    onSuccess={handleSuccess}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
