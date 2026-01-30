'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { UserAccountsForm } from '@/components/form/UserAccountsForm'
import { useRouter } from 'next/navigation'

interface CreateUserAccountDialogProps {
    units?: any[]
    setAccounts: React.Dispatch<React.SetStateAction<any[]>>
}

export const CreateUserAccountDialog = ({ units = [], setAccounts }: CreateUserAccountDialogProps) => {
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
                    <span className="hidden sm:inline">Add User Account</span>
                    <span className="sm:hidden">Add</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-[#1a1a1a] text-white">
                <DialogHeader>
                    <DialogTitle>Add User Account</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    <UserAccountsForm
                        units={units}
                        setAccounts={setAccounts}
                        onSuccess={handleSuccess}
                        onCancel={() => setOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
