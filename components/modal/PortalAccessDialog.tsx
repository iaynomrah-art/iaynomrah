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
import { Check, Copy, KeyRound, Loader2, RefreshCw, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { revokePortalAccess, setPortalPassword, type PortalAccessStatus } from "@/lib/portal-actions"
import { generatePassword } from "@/lib/generate-password"

interface PortalAccessDialogProps {
    account: { id: string; email: string; first_name?: string; last_name?: string }
    status: PortalAccessStatus | null
    onChange: (status: PortalAccessStatus | null) => void
}

/** Create an owner's portal login with a password, reset it, or remove it. */
export function PortalAccessDialog({ account, status, onChange }: PortalAccessDialogProps) {
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState<"save" | "revoke" | null>(null)
    const [password, setPassword] = useState("")
    const [saved, setSaved] = useState<{ email: string; password: string } | null>(null)
    const [isCopied, setIsCopied] = useState(false)
    const name = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email
    const hasAccess = status === "active"

    const handleOpenChange = (next: boolean) => {
        if (pending) return
        setOpen(next)
        if (next) {
            setPassword(generatePassword())
        } else {
            setSaved(null)
            setIsCopied(false)
        }
    }

    const handleSave = async () => {
        setPending("save")
        const result = await setPortalPassword(account.id, password)
        setPending(null)
        if (result.error || !("email" in result)) {
            toast.error(result.error || "Failed to save the login")
            return
        }
        setSaved({ email: result.email ?? account.email, password })
        onChange("active")
    }

    const handleRevoke = async () => {
        setPending("revoke")
        const result = await revokePortalAccess(account.id)
        setPending(null)
        if (result.error) {
            toast.error(result.error)
            return
        }
        toast.success(`Portal access removed for ${name}`)
        onChange(null)
        setOpen(false)
    }

    const copyDetails = async () => {
        if (!saved) return
        const loginUrl = `${window.location.origin}/portal/login`
        try {
            await navigator.clipboard.writeText(`Login: ${loginUrl}\nEmail: ${saved.email}\nPassword: ${saved.password}`)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch {
            toast.error("Failed to copy")
        }
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                title={hasAccess ? "Portal access: active" : "Give portal access"}
                className={`h-8 w-8 hover:bg-[#262626] transition-colors ${hasAccess ? "text-emerald-500 hover:text-emerald-400" : "text-muted-foreground hover:text-blue-400"}`}
                onClick={() => handleOpenChange(true)}
            >
                {hasAccess ? <UserCheck className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Owner portal access</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">
                            <span className="text-white font-medium">{name}</span> · {account.email}
                            <br />
                            {hasAccess ? "Active: they can log in at /portal/login." : "No portal access yet."}
                        </DialogDescription>
                    </DialogHeader>

                    {saved ? (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-300">
                                Login saved. Send these details to {name}. They can change the password after logging in.
                            </p>
                            <div className="rounded-md bg-[#111] border border-gray-800 p-3 text-sm font-mono space-y-1 break-all">
                                <div><span className="text-gray-500">Email:</span> {saved.email}</div>
                                <div><span className="text-gray-500">Password:</span> {saved.password}</div>
                            </div>
                            <Button onClick={copyDetails} variant="outline" className="w-full bg-[#111111] border-gray-800 hover:bg-[#1a1a1a] text-white">
                                {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                {isCopied ? "Copied" : "Copy login details"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor={`portal-password-${account.id}`} className="text-gray-300">
                                {hasAccess ? "New password" : "Password"}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id={`portal-password-${account.id}`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-[#111111] border-gray-800 text-white font-mono"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    title="Generate another"
                                    onClick={() => setPassword(generatePassword())}
                                    className="bg-[#111111] border-gray-800 hover:bg-[#1a1a1a] text-white shrink-0"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-[11px] text-gray-500">
                                {hasAccess
                                    ? "Resetting signs them out everywhere. Use this if they forgot their password."
                                    : "They'll see their funder accounts, their side of each trade, and their payouts. Not credentials, costs, or other people's accounts."}
                            </p>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                        {hasAccess && !saved && (
                            <Button
                                variant="ghost"
                                onClick={handleRevoke}
                                disabled={pending !== null}
                                className="sm:mr-auto text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                {pending === "revoke" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
                                Remove access
                            </Button>
                        )}
                        {saved ? (
                            <Button onClick={() => handleOpenChange(false)} className="bg-blue-600 hover:bg-blue-500 text-white">
                                Done
                            </Button>
                        ) : (
                            <Button onClick={handleSave} disabled={pending !== null || password.length < 8} className="bg-blue-600 hover:bg-blue-500 text-white">
                                {pending === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {hasAccess ? "Reset password" : "Create login"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
