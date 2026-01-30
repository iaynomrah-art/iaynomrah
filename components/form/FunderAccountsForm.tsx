"use client"

import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Save, Loader2, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createFunderAccount, updateFunderAccount } from "@/helper/funder_accounts"
import { FunderAccount } from "@/types/funder_accounts"
import { Package } from "@/types/package"
import { Account } from "@/types/accounts"
import { Unit } from "@/types/units"
import { Funder } from "@/types/funder"

const funderAccountSchema = z.object({
    funder_id: z.string().min(1, "Funder is required"),
    package_id: z.string().min(1, "Package is required"),
    acount_id: z.string().min(1, "User is required"),
})

type FunderAccountFormValues = z.infer<typeof funderAccountSchema>

interface FunderAccountsFormProps {
    initialData?: FunderAccount | null
    packages?: Package[]
    accounts?: Account[]
    units?: Unit[]
    funders?: Funder[]
    // Added these two props to handle Modal logic
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const FunderAccountsForm = ({
    initialData,
    packages = [],
    accounts = [],
    units = [],
    funders = [],
    onSuccess, // Destructure here
    onCancel   // Destructure here
}: FunderAccountsFormProps) => {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)
    const isUpdate = !!initialData

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FunderAccountFormValues>({
        resolver: zodResolver(funderAccountSchema),
        defaultValues: {
            funder_id: initialData?.package?.funder_id || "",
            package_id: initialData?.package_id || "",
            acount_id: initialData?.acount_id || "",
        },
    })

    const selectedPackageId = watch("package_id")

    // Auto-sync Funder when Package changes
    useEffect(() => {
        if (selectedPackageId) {
            // Find the package object
            const pkg = packages.find(p => p.id.toString() === selectedPackageId);
            if (pkg) {
                // Determine the key for 'funder_id'. 
                // Note: The Package type might use 'funder_id' (database column naming) or similar. 
                // Based on previous code: pkg.funder_id
                setValue("funder_id", pkg.funder_id?.toString() || "");
            }
        }
    }, [selectedPackageId, packages, setValue])

    const onSubmit = async (data: FunderAccountFormValues) => {
        setIsPending(true)
        try {
            // Prepare payload with correct types and keys
            const payload = {
                package_id: data.package_id,
                acount_id: data.acount_id,
                status: initialData?.status ?? "idle",
            }

            if (isUpdate) {
                await updateFunderAccount(initialData.id, payload)
                toast.success("Funder account updated successfully")
            } else {
                await createFunderAccount(payload)
                toast.success("Funder account created successfully")
            }

            // --- CHANGED LOGIC HERE ---
            if (onSuccess) {
                // If in Modal: Call parent handler to Close Modal + Refresh Data
                onSuccess();
            } else {
                // If on Standalone Page: Navigate back
                router.push("/dashboard/trading-accounts/funder-accounts")
                router.refresh()
            }

        } catch (error: any) {
            toast.error(error.message || "Failed to save funder account")
        } finally {
            setIsPending(false)
        }
    }

    // Helper for Cancel button
    const handleCancel = () => {
        if (onCancel) {
            onCancel() // Close modal
        } else {
            router.back() // Go back in history
        }
    }

    // Helper to get Funder Name for a package
    const getPackageDisplayName = (pkg: Package) => {
        const funder = funders.find(f => f.id === pkg.funder_id);
        const funderName = funder ? funder.name : "Unknown Funder";
        return `${funderName} - ${pkg.name}`;
    }

    return (
        <div className="space-y-6">
            {/* Only show Title if NOT in a modal (usually modals have their own headers) */}
            {!onSuccess && (
                <h1 className="text-xl font-semibold text-white tracking-tight">Add Funder Account</h1>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* USER */}
                <div className="space-y-2">
                    <Label htmlFor="acount_id" className="text-white text-sm font-medium">USER</Label>
                    <div className="relative">
                        <select
                            id="acount_id"
                            {...register("acount_id")}
                            className="flex h-11 w-full rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] text-white px-4 py-2 text-sm appearance-none focus:border-blue-500 transition-all outline-none ring-0 shadow-inner"
                        >
                            <option value="">-- Select User --</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.first_name} {acc.last_name} ({acc.email})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {errors.acount_id && <p className="text-xs text-red-500 mt-1">{errors.acount_id.message}</p>}
                </div>

                {/* PACKAGE - MOVED UP and Logic Changed */}
                <div className="space-y-2">
                    <Label htmlFor="package_id" className="text-white text-sm font-medium">PACKAGE</Label>
                    <div className="relative">
                        <select
                            id="package_id"
                            {...register("package_id")}
                            className="flex h-11 w-full rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] text-white px-4 py-2 text-sm appearance-none focus:border-blue-500 transition-all outline-none ring-0 shadow-inner"
                        >
                            <option value="">-- Select Package --</option>
                            {packages.map((pkg) => {
                                const isUsed = pkg.is_used && pkg.id !== initialData?.package_id
                                return (
                                    <option key={pkg.id} value={pkg.id} disabled={isUsed}>
                                        {getPackageDisplayName(pkg)} {isUsed ? "(Already Used)" : ""}
                                    </option>
                                )
                            })}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {errors.package_id && <p className="text-xs text-red-500 mt-1">{errors.package_id.message}</p>}
                </div>

                {/* FUNDER - Now Disabled/Read-only */}
                <div className="space-y-2">
                    <Label htmlFor="funder_id" className="text-white text-sm font-medium">FUNDER (Auto-selected)</Label>
                    <div className="relative">
                        <select
                            id="funder_id"
                            {...register("funder_id")}
                            disabled
                            className="flex h-11 w-full rounded-lg border border-[#1a1a1a] bg-[#1a1a1a] text-gray-400 px-4 py-2 text-sm appearance-none cursor-not-allowed shadow-inner"
                        >
                            <option value="">-- Funder --</option>
                            {funders.map((funder) => (
                                <option key={funder.id} value={funder.id}>
                                    {funder.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {errors.funder_id && <p className="text-xs text-red-500 mt-1">{errors.funder_id.message}</p>}
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
                        {isUpdate ? "Update Account" : "Add Account"}
                    </Button>
                </div>
            </form>
        </div>
    )
}