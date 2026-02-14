'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import { AccountCredentialsForm } from '@/components/form/AccountCredentialsForm'
import { useRouter } from 'next/navigation'

interface EditCredentialDialogProps {
    credential: any
}

export const EditCredentialDialog = ({
    credential,
}: EditCredentialDialogProps) => {
    const [open, setOpen] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])
    const [funders, setFunders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const fetchOptions = async () => {
            if (open) {
                setIsLoading(true)
                try {
                    const [fnds, accs] = await Promise.all([
                        import('@/helper/funders').then(m => m.getFunders()),
                        import('@/helper/accounts').then(m => m.getAccounts())
                    ])
                    setFunders(fnds)
                    setAccounts(accs)
                } catch (error) {
                    console.error("Failed to fetch options", error)
                } finally {
                    setIsLoading(false)
                }
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

            <DialogContent className="max-w-md bg-[#0a0a0a] border-[#1a1a1a] text-white">
                <DialogHeader>
                    <DialogTitle>Edit Credential</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    {isLoading ? (
                        <div className="space-y-4 py-4">
                            <div className="h-10 bg-[#1a1a1a] rounded animate-pulse" />
                            <div className="h-10 bg-[#1a1a1a] rounded animate-pulse" />
                            <div className="h-10 bg-[#1a1a1a] rounded animate-pulse" />
                        </div>
                    ) : (
                        <AccountCredentialsForm
                            initialData={credential}
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
