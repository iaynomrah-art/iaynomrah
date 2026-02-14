'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AccountCredentialsForm } from '@/components/form/AccountCredentialsForm'

interface CreateCredentialDialogProps { }

export const CreateCredentialDialog = () => {
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
                <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 gap-2 shadow-lg shadow-blue-900/10 transition-all active:scale-95">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Credential</span>
                    <span className="sm:hidden">Add</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl bg-[#0a0a0a] border-[#1a1a1a] text-white">
                <DialogHeader>
                    <DialogTitle>Add Credential</DialogTitle>
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