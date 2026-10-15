"use client"

import React, { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { changePortalPassword } from "@/lib/portal/owner-actions"

const MIN_PASSWORD_LENGTH = 8

/** Lets a logged-in owner replace the password the team gave them. Opened from the portal's user menu. */
export function PortalChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [current, setCurrent] = useState("")
    const [next, setNext] = useState("")
    const [confirm, setConfirm] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleOpenChange = (value: boolean) => {
        if (isPending) return
        onOpenChange(value)
        if (!value) {
            setCurrent("")
            setNext("")
            setConfirm("")
            setError(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (next.length < MIN_PASSWORD_LENGTH) {
            setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`)
            return
        }
        if (next !== confirm) {
            setError("New passwords do not match")
            return
        }

        setIsPending(true)
        const result = await changePortalPassword(current, next)
        setIsPending(false)
        if (result.error) {
            setError(result.error)
            return
        }
        toast.success("Password changed")
        handleOpenChange(false)
    }

    const inputClass = "bg-[#111111] border-gray-800 text-white"

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Change password</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">
                            This signs you out on your other devices.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password" className="text-gray-300">Current password</Label>
                            <Input id="current-password" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password" className="text-gray-300">New password</Label>
                            <Input id="new-password" type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
                            <p className="text-[11px] text-gray-500">At least {MIN_PASSWORD_LENGTH} characters</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-new-password" className="text-gray-300">Confirm new password</Label>
                            <Input id="confirm-new-password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
                        </div>
                        {error && (
                            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{error}</p>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save password
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
