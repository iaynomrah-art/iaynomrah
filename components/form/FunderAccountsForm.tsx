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

const funderAccountSchema = z.object({
    funder_id: z.string().min(1, "Funder is required"),
    package_id: z.string().min(1, "Package is required"),
    acount_id: z.string().min(1, "User is required"),
    unit_id: z.string().min(1, "Server Unit is required"),
})

type FunderAccountFormValues = z.infer<typeof funderAccountSchema>

interface FunderAccountsFormProps {
    initialData?: any | null
    packages?: any[]
    accounts?: any[]
    units?: any[]
    funders?: any[]
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
    const [filteredPackages, setFilteredPackages] = useState<any[]>([])
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
            funder_id: initialData?.package?.funder_id?.toString() || "",
            package_id: initialData?.package_id?.toString() || "",
            acount_id: initialData?.acount_id?.toString() || "",
            unit_id: initialData?.unit_id?.toString() || "",
        },
    })

    const selectedFunderId = watch("funder_id")

    // Filter packages when funder changes
    useEffect(() => {
        if (selectedFunderId) {
            const filtered = packages.filter(pkg => pkg.funder_id?.toString() === selectedFunderId)
            setFilteredPackages(filtered)

            // Reset package if it's not in the filtered list (unless it's the initial load)
            const currentPackageId = watch("package_id")
            if (currentPackageId && !filtered.find(pkg => pkg.id.toString() === currentPackageId)) {
                setValue("package_id", "")
            }
        } else {
            setFilteredPackages([])
        }
    }, [selectedFunderId, packages, setValue, watch])

    const onSubmit = async (data: FunderAccountFormValues) => {
        setIsPending(true)
        try {
            // Find labels for the text-based columns
            const selectedPackage = packages.find(p => p.id.toString() === data.package_id)
            const selectedAccount = accounts.find(a => a.id.toString() === data.acount_id)
            const selectedUnit = units.find(u => u.id.toString() === data.unit_id)
            const selectedFunder = funders.find(f => f.id.toString() === data.funder_id)

            // Prepare payload with correct types and keys
            const payload = {
                package_id: parseInt(data.package_id),
                acount_id: parseInt(data.acount_id),
                unit_id: parseInt(data.unit_id),
                status: initialData?.status ?? true,
                // Denormalized text columns for easy display
                user: selectedAccount ? `${selectedAccount.first_name} ${selectedAccount.last_name}`.trim() : null,
                package: selectedPackage?.name || null,
                unit: selectedUnit?.unit_name || null,
                funder: selectedFunder?.name || null
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

                {/* FUNDER */}
                <div className="space-y-2">
                    <Label htmlFor="funder_id" className="text-white text-sm font-medium">FUNDER</Label>
                    <div className="relative">
                        <select
                            id="funder_id"
                            {...register("funder_id")}
                            className="flex h-11 w-full rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] text-white px-4 py-2 text-sm appearance-none focus:border-blue-500 transition-all outline-none ring-0 shadow-inner"
                        >
                            <option value="">-- Select Funder --</option>
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

                {/* PACKAGE */}
                <div className="space-y-2">
                    <Label htmlFor="package_id" className="text-white text-sm font-medium">PACKAGE</Label>
                    <div className="relative">
                        <select
                            id="package_id"
                            {...register("package_id")}
                            disabled={!selectedFunderId}
                            className="flex h-11 w-full rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] text-white px-4 py-2 text-sm appearance-none focus:border-blue-500 transition-all outline-none ring-0 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">
                                {!selectedFunderId ? "-- Select Funder First --" : "-- Select Package --"}
                            </option>
                            {filteredPackages.map((pkg) => (
                                <option key={pkg.id} value={pkg.id}>
                                    {pkg.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {errors.package_id && <p className="text-xs text-red-500 mt-1">{errors.package_id.message}</p>}
                </div>

                {/* SERVER UNIT */}
                <div className="space-y-2">
                    <Label htmlFor="unit_id" className="text-white text-sm font-medium">SERVER UNIT</Label>
                    <div className="relative">
                        <select
                            id="unit_id"
                            {...register("unit_id")}
                            className="flex h-11 w-full rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] text-white px-4 py-2 text-sm appearance-none focus:border-blue-500 transition-all outline-none ring-0 shadow-inner"
                        >
                            <option value="">-- Select Server Unit --</option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.unit_name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {errors.unit_id && <p className="text-xs text-red-500 mt-1">{errors.unit_id.message}</p>}
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