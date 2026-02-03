"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, Loader2, ChevronDown } from "lucide-react"
import { createPackage, updatePackage } from "@/helper/package"
import { useRouter } from "next/navigation"
import { Funder } from "@/types/funder"
import { toast } from "sonner"
import Swal from "sweetalert2"

const packageSchema = z.object({
    name: z.string().min(1, "Package name is required"),
    balance: z.string().min(1, "Balance is required"),
    phase: z.string().min(1, "Phase is required"),
    symbol: z.string().min(1, "symbol is required"),
    funder_id: z.string().min(1, "Funder is required"),
})

type PackageFormValues = z.infer<typeof packageSchema>

interface PackageFormProps {
    initialData?: any | null
    funders: Funder[]
    onSuccess?: () => void
    onCancel?: () => void
}

export const PackageForm = ({ initialData, funders, onSuccess, onCancel }: PackageFormProps) => {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)

    const isUpdate = !!initialData

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PackageFormValues>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            name: initialData?.name || "",
            balance: initialData?.balance?.toString() || "",
            phase: initialData?.phase?.toLowerCase() || "",
            symbol: initialData?.symbol || "",
            funder_id: initialData?.funder_id?.toString() || "",
        },
    })

    const onSubmit = async (data: PackageFormValues) => {
        setIsPending(true)
        try {
            const payload = {
                name: data.name,
                balance: parseFloat(data.balance),
                phase: data.phase,
                symbol: data.symbol,
                funder_id: data.funder_id,
            }

            if (isUpdate) {
                await updatePackage(initialData.id, payload)
                toast.success("Package updated successfully")
            } else {
                await createPackage(payload)
                toast.success("Package created successfully")
            }

            if (onSuccess) {
                onSuccess()
            } else {
                router.push("/dashboard/funders/packages")
            }
            router.refresh()
        } catch (error: any) {
            console.error("Operation failed:", error)
            Swal.fire({
                title: 'Error!',
                text: error.message || "Something went wrong",
                icon: 'error',
                confirmButtonColor: '#2563eb',
                background: '#0a0a0a',
                color: '#ffffff'
            })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Funder Selection */}
            <div className="space-y-2">
                <Label htmlFor="funder_id" className="text-white">
                    Select Funder <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                    <select
                        id="funder_id"
                        {...register("funder_id")}
                        className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 text-white px-3 py-1 text-sm appearance-none focus:border-blue-500 transition-colors"
                    >
                        <option value="">-- Select Funder --</option>
                        {funders.map((funder) => (
                            <option key={funder.id} value={funder.id}>
                                {funder.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.funder_id && <p className="text-xs text-red-500">{errors.funder_id.message}</p>}
            </div>

            {/* Package Name */}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                    Package Name <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="name"
                    {...register("name")}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    placeholder="e.g. 100K Evaluation"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-6">
                {/* Balance */}
                <div className="space-y-2">
                    <Label htmlFor="balance" className="text-white">
                        Balance ($) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                        id="balance"
                        type="number"
                        step="0.01"
                        {...register("balance")}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        placeholder="100000"
                    />
                    {errors.balance && <p className="text-xs text-red-500">{errors.balance.message}</p>}
                </div>

                {/* Phase */}
                <div className="space-y-2">
                    <Label htmlFor="phase" className="text-white">
                        Phase <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                        <select
                            id="phase"
                            {...register("phase")}
                            className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 text-white px-3 py-1 text-sm appearance-none focus:border-blue-500 transition-colors"
                        >
                            <option value="">-- select phase --</option>
                            <option value="live">live</option>
                            <option value="phase 1">phase 1</option>
                            <option value="phase 2">phase 2</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.phase && <p className="text-xs text-red-500">{errors.phase.message}</p>}
                </div>

                {/* symbol */}
                <div className="space-y-2">
                    <Label htmlFor="symbol" className="text-white">
                        Symbol <span className="text-red-400">*</span>
                    </Label>
                    <Input
                        id="symbol"
                        {...register("symbol")}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        placeholder="e.g. MT5"
                    />
                    {errors.symbol && <p className="text-xs text-red-500">{errors.symbol.message}</p>}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onCancel ? onCancel() : router.back()}
                    className="text-white hover:bg-gray-800 px-6"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isUpdate ? "Update Package" : "Add Package"}
                </Button>
            </div>
        </form>
    )
}
