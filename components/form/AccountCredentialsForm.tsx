"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, Loader2, ChevronDown, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createCredential, updateCredential } from "@/helper/credentials"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Controller } from "react-hook-form"
import { Credential } from "@/types/credentials"

const credentialSchema = z.object({
    name: z.string().min(1, "Account Name is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    platform: z.string().optional(),
    platform_id: z.string().optional(),
})

type CredentialFormValues = z.infer<typeof credentialSchema>

interface AccountCredentialsFormProps {
    initialData?: Credential | null
    // Add Modal Logic Props
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const AccountCredentialsForm = ({
    initialData,
    onSuccess,
    onCancel
}: AccountCredentialsFormProps) => {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const isUpdate = !!initialData

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CredentialFormValues>({
        resolver: zodResolver(credentialSchema),
        values: {
            name: initialData?.name || "",
            username: initialData?.username || "",
            password: initialData?.password || "",
            platform: initialData?.platform ?? "",
            platform_id: initialData?.platform_id ?? "",
        },
    })


    const onSubmit = async (data: CredentialFormValues) => {
        setIsPending(true)
        try {
            if (isUpdate) {
                await updateCredential(initialData.id, data)
                toast.success("Credential updated successfully")
            } else {
                await createCredential(data)
                toast.success("Credential created successfully")
            }

            // 2. Updated Navigation Logic
            if (onSuccess) {
                // If in Modal: Close and Refresh Parent
                onSuccess()
            } else {
                // If on Page: Navigate away
                router.push("/dashboard/trading-accounts/credentials")
                router.refresh()
            }

        } catch (error: any) {
            toast.error(error.message || "Failed to save credentials")
        } finally {
            setIsPending(false)
        }
    }

    // 3. Helper for Cancel Button
    const handleCancel = () => {
        if (onCancel) {
            onCancel() // Close modal
        } else {
            router.back() // Go back in history
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Only show title if NOT in a modal */}
            {!onSuccess && (
                <h1 className="text-xl font-semibold text-white tracking-tight">
                    {isUpdate ? "Update Credential" : "Add Account Credentials"}
                </h1>
            )}

            {/* ACCOUNT NAME */}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-white text-sm font-medium uppercase tracking-wider">ACCOUNT NAME</Label>
                <Input
                    id="name"
                    {...register("name")}
                    className="bg-[#0d0d0d] border-[#1a1a1a] text-white placeholder:text-gray-500 h-11 focus:border-blue-500 transition-all shadow-inner"
                    placeholder="Enter account profile name"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* PLATFORM */}
                <div className="space-y-2">
                    <Label htmlFor="platform" className="text-white text-sm font-medium uppercase tracking-wider">PLATFORM</Label>
                    <Controller
                        name="platform"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="w-full bg-[#0d0d0d] border-[#1a1a1a] text-white h-11 focus:border-blue-500 transition-all shadow-inner">
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
                                    <SelectItem value="cTrader">cTrader</SelectItem>
                                    <SelectItem value="Trade Locker">Trade Locker</SelectItem>
                                    <SelectItem value="Tradeverse">Tradeverse</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* PLATFORM ID */}
                <div className="space-y-2">
                    <Label htmlFor="platform_id" className="text-white text-sm font-medium uppercase tracking-wider">PLATFORM ID</Label>
                    <Input
                        id="platform_id"
                        {...register("platform_id")}
                        className="bg-[#0d0d0d] border-[#1a1a1a] text-white placeholder:text-gray-500 h-11 focus:border-blue-500 transition-all shadow-inner"
                        placeholder="Enter IDs"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* USERNAME */}
                <div className="space-y-2">
                    <Label htmlFor="username" className="text-white text-sm font-medium uppercase tracking-wider">USERNAME</Label>
                    <Input
                        id="username"
                        {...register("username")}
                        className="bg-[#0d0d0d] border-[#1a1a1a] text-white placeholder:text-gray-500 h-11 focus:border-blue-500 transition-all shadow-inner"
                        placeholder="Enter platform username"
                    />
                    {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-white text-sm font-medium uppercase tracking-wider">PASSWORD</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            {...register("password")}
                            className="bg-[#0d0d0d] border-[#1a1a1a] text-white placeholder:text-gray-500 h-11 pr-12 focus:border-blue-500 transition-all shadow-inner"
                            placeholder="Enter platform password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#1a1a1a]">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                    className="text-gray-400 hover:bg-[#1a1a1a] hover:text-white px-6 transition-all"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isUpdate ? "Update Credential" : "Add Credentials"}
                </Button>
            </div>
        </form>
    )
}