"use client"

import React from "react"
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
    funder_id: z.string().min(1, "Funder is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
})

type CredentialFormValues = z.infer<typeof credentialSchema>

interface AccountCredentialsFormProps {
    initialData?: any | null
    funders?: any[]
}

export const AccountCredentialsForm = ({
    initialData,
    funders = []
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
            funder_id: initialData?.funder_id?.toString() || "",
            username: initialData?.username || "",
            password: initialData?.password || "",
        },
    })

    const onSubmit = async (data: CredentialFormValues) => {
        setIsPending(true)
        try {
            const payload = {
                ...data,
                funder_id: parseInt(data.funder_id),
            }

            if (isUpdate) {
                await updateCredential(initialData.id, payload)
                toast.success("Credential updated successfully")
            } else {
                await createCredential(payload)
                toast.success("Credential created successfully")
            }
            router.push("/dashboard/trading-accounts/credentials")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to save credentials")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <h1 className="text-xl font-semibold text-white tracking-tight">
                {isUpdate ? "Update Credential" : "Add Account Credentials"}
            </h1>

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
                    onClick={() => router.back()}
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
