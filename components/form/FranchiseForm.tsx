"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, Loader2 } from "lucide-react"
import { createFranchise, updateFranchise } from "@/helper/franchise"
import { useRouter } from "next/navigation"
import { Franchise, CreateFranchise, UpdateFranchise } from "@/types/franchise"
import { toast } from "sonner"
import Swal from "sweetalert2"

const franchiseSchema = z.object({
    name: z.string().min(1, "Franchise name is required"),
    code: z.string().min(1, "Franchise code is required"),
    investor_name: z.string().min(1, "Investor name is required"),
    description: z.string().optional(),
})

type FranchiseFormValues = z.infer<typeof franchiseSchema>

interface FranchiseFormProps {
    initialData?: Franchise | null
}

export const FranchiseForm = ({ initialData }: FranchiseFormProps) => {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FranchiseFormValues>({
        resolver: zodResolver(franchiseSchema),
        defaultValues: {
            name: initialData?.name || "",
            code: initialData?.code || "",
            investor_name: initialData?.investor_name || "",
            description: initialData?.description || "",
        },
    })

    const onSubmit = async (data: FranchiseFormValues) => {
        setIsPending(true)
        try {
            if (initialData?.id) {
                const payload: UpdateFranchise = {
                    name: data.name,
                    code: data.code,
                    investor_name: data.investor_name,
                    description: data.description ?? null,
                }
                await updateFranchise(initialData.id, payload)
                toast.success("Franchise updated successfully")
            } else {
                const payload: CreateFranchise = {
                    name: data.name,
                    code: data.code,
                    investor_name: data.investor_name,
                    description: data.description ?? null,
                }
                await createFranchise(payload)
                toast.success("Franchise created successfully")
            }

            router.push("/dashboard/trading-units/my-units")
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
            <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                    Franchise Name <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="name"
                    {...register("name")}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    placeholder="Enter franchise name"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="code" className="text-white">
                    Franchise Code <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="code"
                    {...register("code")}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    placeholder="Enter franchise code"
                />
                {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="investor_name" className="text-white">
                    Investor Name <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="investor_name"
                    {...register("investor_name")}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    placeholder="Enter investor name"
                />
                {errors.investor_name && <p className="text-xs text-red-500">{errors.investor_name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                    Description
                </Label>
                <Textarea
                    id="description"
                    {...register("description")}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 min-h-[100px]"
                    placeholder="Enter franchise description"
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
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
                    {initialData ? "Update Franchise" : "Add Franchise"}
                </Button>
            </div>
        </form>
    )
}
