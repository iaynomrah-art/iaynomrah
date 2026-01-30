'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import { AccountCredentialsForm } from '@/components/form/AccountCredentialsForm'
import { useRouter } from 'next/navigation'

interface EditCredentialDialogProps {
    credential: any
    funders: any[]
}

export const EditCredentialDialog = ({
    credential,
    funders
}: EditCredentialDialogProps) => {
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

            <DialogContent className="max-w-md bg-[#0a0a0a] border-[#1a1a1a] text-white">
                <DialogHeader>
                    <DialogTitle>Edit Credential</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    <AccountCredentialsForm
                        initialData={credential}
                        onSuccess={handleSuccess}
                        onCancel={() => setOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
