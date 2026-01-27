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
import { createAccount, updateAccount } from "@/helper/accounts"

const userAccountSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    middle_name: z.string().optional(),
    last_name: z.string().min(1, "Last name is required"),
    birth_year: z.string().optional(),
    birth_month: z.string().optional(),
    birth_day: z.string().optional(),
    email: z.string().email("Invalid email address"),
    contact_number: z.string().min(1, "Contact number 1 is required"),
    contact_number_2: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    city: z.string().optional(),
    province: z.string().optional(),
    zip_code: z.string().optional(),
    id_type: z.string().min(1, "ID type is required"),
    billing: z.string().min(1, "Billing is required"),
})

type UserAccountFormValues = z.infer<typeof userAccountSchema>

interface UserAccountsFormProps {
    initialData?: any | null
}

export const UserAccountsForm = ({ initialData }: UserAccountsFormProps) => {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)
    const isUpdate = !!initialData

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UserAccountFormValues>({
        resolver: zodResolver(userAccountSchema),
        defaultValues: {
            first_name: initialData?.first_name || "",
            middle_name: initialData?.middle_name || "",
            last_name: initialData?.last_name || "",
            birth_year: initialData?.birth_year || "",
            birth_month: initialData?.birth_month || "",
            birth_day: initialData?.birth_day || "",
            email: initialData?.email || "",
            contact_number: initialData?.contact_number || "",
            contact_number_2: initialData?.contact_number_2 || "",
            address: initialData?.address || "",
            city: initialData?.city || "",
            province: initialData?.province || "",
            zip_code: initialData?.zip_code || "",
            id_type: initialData?.id_type || "",
            billing: initialData?.billing || "",
        },
    })

    const onSubmit = async (data: UserAccountFormValues) => {
        setIsPending(true)
        try {
            if (isUpdate) {
                await updateAccount(initialData.id, data)
                toast.success("User account updated successfully")
            } else {
                await createAccount(data)
                toast.success("User account created successfully")
            }
            router.push("/dashboard/trading-accounts/user-accounts")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to save user account")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-semibold text-white tracking-tight">
                {isUpdate ? "Update User Account" : "Add User Account"}
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* FIRST NAME */}
                    <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-white">FIRST NAME</Label>
                        <Input
                            id="first_name"
                            {...register("first_name")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="Enter first name"
                        />
                        {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
                    </div>

                    {/* MIDDLE NAME */}
                    <div className="space-y-2">
                        <Label htmlFor="middle_name" className="text-white">MIDDLE NAME</Label>
                        <Input
                            id="middle_name"
                            {...register("middle_name")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="Enter middle name"
                        />
                    </div>

                    {/* LAST NAME */}
                    <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-white">LAST NAME</Label>
                        <Input
                            id="last_name"
                            {...register("last_name")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="Enter last name"
                        />
                        {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
                    </div>
                </div>

                {/* BIRTH DATE */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="birth_year" className="text-white">BIRTH YEAR</Label>
                        <Input
                            id="birth_year"
                            {...register("birth_year")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="YYYY"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="birth_month" className="text-white">BIRTH MONTH</Label>
                        <Input
                            id="birth_month"
                            {...register("birth_month")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="MM"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="birth_day" className="text-white">BIRTH DAY</Label>
                        <Input
                            id="birth_day"
                            {...register("birth_day")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="DD"
                        />
                    </div>
                </div>

                {/* EMAIL ADDRESS */}
                <div className="space-y-2">
                    <Label htmlFor="email_address" className="text-white">EMAIL ADDRESS</Label>
                    <Input
                        id="email_address"
                        type="email"
                        {...register("email")}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                        placeholder="Enter email address"
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                {/* CONTACT NUMBERS */}
                <div className="grid grid-cols-2 gap-4">
                    {/* CONTACT NUMBER 1 */}
                    <div className="space-y-2">
                        <Label htmlFor="contact_number_1" className="text-white">CONTACT NUMBER 1</Label>
                        <Input
                            id="contact_number_1"
                            {...register("contact_number")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="Enter contact number 1"
                        />
                        {errors.contact_number && <p className="text-xs text-red-500">{errors.contact_number.message}</p>}
                    </div>

                    {/* CONTACT NUMBER 2 */}
                    <div className="space-y-2">
                        <Label htmlFor="contact_number_2" className="text-white">CONTACT NUMBER 2</Label>
                        <Input
                            id="contact_number_2"
                            {...register("contact_number_2")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="Enter contact number 2"
                        />
                    </div>
                </div>

                {/* ADDRESS */}
                <div className="space-y-2">
                    <Label htmlFor="address" className="text-white">ADDRESS</Label>
                    <Input
                        id="address"
                        {...register("address")}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                        placeholder="Enter street address"
                    />
                    {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
                </div>

                {/* CITY, PROVINCE, ZIP */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city" className="text-white">CITY</Label>
                        <Input
                            id="city"
                            {...register("city")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="City"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="province" className="text-white">PROVINCE</Label>
                        <Input
                            id="province"
                            {...register("province")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="Province"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="zip_code" className="text-white">ZIP CODE</Label>
                        <Input
                            id="zip_code"
                            {...register("zip_code")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            placeholder="ZipCode"
                        />
                    </div>
                </div>

                {/* ID TYPE */}
                <div className="space-y-2">
                    <Label htmlFor="id_type" className="text-white">ID TYPE</Label>
                    <div className="relative">
                        <select
                            id="id_type"
                            {...register("id_type")}
                            className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 text-white px-3 py-1 text-sm appearance-none focus:border-blue-500 transition-colors"
                        >
                            <option value="">-- Select ID Type --</option>
                            <option value="National ID">National ID</option>
                            <option value="Passport">Passport</option>
                            <option value="Driver's License">Driver's License</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.id_type && <p className="text-xs text-red-500">{errors.id_type.message}</p>}
                </div>

                {/* BILLING */}
                <div className="space-y-2">
                    <Label htmlFor="billing" className="text-white">BILLING</Label>
                    <Input
                        id="billing"
                        {...register("billing")}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                        placeholder="Enter billing address/info"
                    />
                    {errors.billing && <p className="text-xs text-red-500">{errors.billing.message}</p>}
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
                        {isUpdate ? "Update Account" : "Add Account"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
