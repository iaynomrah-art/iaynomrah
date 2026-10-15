"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react"
import { portalLogin } from "@/lib/portal/owner-actions"

/** Owner portal login. */
export function PortalAuthForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        const result = await portalLogin(email, password)
        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            return
        }
        router.replace("/portal")
        router.refresh()
    }

    const inputClass = "bg-[#111111] border-gray-800 text-white pl-10 h-11 focus:ring-blue-600/20 focus:border-blue-600"

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-[#0a0a0a] border-gray-800">
                <CardHeader className="space-y-1 pb-6">
                    <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-6 w-6 text-blue-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white tracking-tight">Account owner login</CardTitle>
                    <CardDescription className="text-gray-400">
                        Log in to view your accounts, trades and payouts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${inputClass} pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{error}</p>
                        )}

                        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 font-semibold">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Log in
                        </Button>

                        <p className="text-xs text-gray-500 text-center">
                            Forgot your password? Ask the team to reset it.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
