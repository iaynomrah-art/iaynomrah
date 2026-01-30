"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, Loader2, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createCredential, updateCredential } from "@/helper/credentials"

const credentialSchema = z.object({
    name: z.string().min(1, "Account Name is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
})

type CredentialFormValues = z.infer<typeof credentialSchema>

interface AccountCredentialsFormProps {
    initialData?: any | null
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
    const isUpdate = !!initialData

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CredentialFormValues>({
        resolver: zodResolver(credentialSchema),
        defaultValues: {
            name: initialData?.name || "",
            username: initialData?.username || "",
            password: initialData?.password || "",
        },
    })

    const onSubmit = async (data: CredentialFormValues) => {
        setIsPending(true)
        try {
            const payload = {
                ...data,
            }

            if (isUpdate) {
                await updateCredential(initialData.id, payload)
                toast.success("Credential updated successfully")
            } else {
                await createCredential(payload)
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
                <Label htmlFor="name" className="text-white text-sm font-medium">ACCOUNT NAME</Label>
                <Input
                    id="name"
                    {...register("name")}
                    className="bg-[#0d0d0d] border-[#1a1a1a] text-white placeholder:text-gray-500 h-11 focus:border-blue-500 transition-all shadow-inner"
                    placeholder="Enter account profile name"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* USERNAME */}
            <div className="space-y-2">
                <Label htmlFor="username" className="text-white text-sm font-medium">USERNAME</Label>
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
                <Label htmlFor="password" className="text-white text-sm font-medium">PASSWORD</Label>
                <Input
                    id="password"
                    {...register("password")}
                    className="bg-[#0d0d0d] border-[#1a1a1a] text-white placeholder:text-gray-500 h-11 focus:border-blue-500 transition-all shadow-inner"
                    placeholder="Enter platform password"
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
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