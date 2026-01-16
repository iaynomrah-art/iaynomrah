"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Clock, ChevronDown, Save, Loader2 } from "lucide-react"
import { createFunder } from "@/helper/funders"
import { useRouter } from "next/navigation"
import { CreateFunder } from "@/types/funder"
import { presets } from "@/lib/utils"
import { toast } from "sonner"
import Swal from "sweetalert2"

const funderSchema = z.object({
    name: z.string().min(1, "Funder name is required"),
    allias: z.string().min(1, "Funder alias is required"),
    resetTime: z.string().optional(),
    timezone: z.string().optional(),
    allias_color: z.string().optional(),
    text_color: z.enum(["white", "black"]),
})

type FunderFormValues = z.infer<typeof funderSchema>

export const AddFunderForm = () => {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FunderFormValues>({
        resolver: zodResolver(funderSchema),
        defaultValues: {
            text_color: "white",
            allias_color: "#1c64f2",
        },
    })

    const currentColor = watch("allias_color") || "#1c64f2"

    const onSubmit = async (data: FunderFormValues) => {
        setIsPending(true)
        try {
            // The DB expects reset_time as timestamp with time zone (timestamptz)
            // We use a dummy date for now since the UI only collects time
            let reset_time = null
            if (data.resetTime) {
                const today = new Date().toISOString().split('T')[0]
                reset_time = `${today}T${data.resetTime}:00+08:00`
            }

            const payload: CreateFunder = {
                name: data.name,
                allias: data.allias,
                reset_time: reset_time,
                allias_color: data.allias_color || "#1c64f2",
                text_color: data.text_color,
            }

            await createFunder(payload)

            toast.success("Funder created successfully")

            router.push("/dashboard/funders")
            router.refresh()
        } catch (error: any) {
            console.error("Funder creation failed:", error)
            Swal.fire({
                title: 'Error!',
                text: error.message || "Failed to add funder",
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
            {/* Funder Name */}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                    Funder Name <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="name"
                    {...register("name")}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    placeholder="Enter funder name"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Funder Alias */}
            <div className="space-y-2">
                <Label htmlFor="allias" className="text-white">
                    Funder Alias <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="allias"
                    {...register("allias")}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    placeholder="Enter funder alias"
                />
                {errors.allias && <p className="text-xs text-red-500">{errors.allias.message}</p>}
            </div>

            {/* Reset Time Section */}
            <div className="space-y-4">
                <h3 className="text-white font-medium">Reset Time</h3>
                <div className="grid grid-cols-2 gap-4">
                    {/* Time */}
                    <div className="space-y-2">
                        <Label htmlFor="resetTime" className="text-white">
                            Time
                        </Label>
                        <div className="relative">
                            <Input
                                id="resetTime"
                                type="time"
                                {...register("resetTime")}
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 pr-10 [appearance:none] [&::-webkit-calendar-picker-indicator]:hidden"
                                onClick={(e) => e.currentTarget.showPicker()}
                            />
                            <Clock
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer hover:text-white transition-colors"
                                onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                    input?.showPicker();
                                }}
                            />
                        </div>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-white">
                            Timezone
                        </Label>
                        <div className="relative">
                            <select
                                id="timezone"
                                {...register("timezone")}
                                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 text-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8"
                            >
                                <option value="" className="bg-gray-800">
                                    -- Select Timezone --
                                </option>
                                <option value="Asia/Hong_Kong" className="bg-gray-800">GMT+08:00 (Hong Kong)</option>
                                <option value="Asia/Manila" className="bg-gray-800">GMT+08:00 (Manila)</option>
                                <option value="UTC" className="bg-gray-800">UTC</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Alias Colors Section */}
            <div className="space-y-4">
                <h3 className="text-white font-medium">Alias Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                    {/* Background Color */}
                    <div className="space-y-2">
                        <Label htmlFor="allias_color" className="text-white">
                            Background Color
                        </Label>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    id="allias_color_picker"
                                    type="color"
                                    value={currentColor}
                                    onChange={(e) => setValue("allias_color", e.target.value)}
                                    className="h-10 w-20 cursor-pointer bg-gray-800 border border-gray-700 rounded p-0"
                                />
                                <Input
                                    id="allias_color"
                                    {...register("allias_color")}
                                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 flex-1"
                                    placeholder="#1c64f2"
                                />
                            </div>
                            {/* Preset Colors */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-gray-400 text-xs">Presets:</span>
                                {presets.map((preset) => (
                                    <button
                                        key={preset.color}
                                        type="button"
                                        onClick={() => setValue("allias_color", preset.color)}
                                        className="w-6 h-6 rounded border-2 border-gray-700 hover:border-gray-400 transition-colors"
                                        style={{ backgroundColor: preset.color }}
                                        title={preset.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Text Color */}
                    <div className="space-y-2">
                        <Label className="text-white">
                            Text Color
                        </Label>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="textColorBlack"
                                    value="black"
                                    {...register("text_color")}
                                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 focus:ring-blue-500"
                                />
                                <Label htmlFor="textColorBlack" className="text-white cursor-pointer">
                                    Black
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="textColorWhite"
                                    value="white"
                                    {...register("text_color")}
                                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 focus:ring-blue-500"
                                />
                                <Label htmlFor="textColorWhite" className="text-white cursor-pointer">
                                    White
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Buttons */}
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
                    Add Funder
                </Button>
            </div>
        </form>
    )
}