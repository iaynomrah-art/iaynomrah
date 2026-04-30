"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"
import { createFunderSuggestion } from "@/helper/funders"
import { presets } from "@/lib/utils"
import { toast } from "sonner"
import Swal from "sweetalert2"

const funderSuggestionSchema = z.object({
    name: z.string().min(1, "Funder name is required"),
    allias: z.string().min(1, "Funder alias is required"),
    allias_color: z.string().optional(),
    text_color: z.enum(["white", "black"]),
})

type FunderSuggestionFormValues = z.infer<typeof funderSuggestionSchema>

interface FunderSuggestionFormProps {
    onSuccess?: () => void
    onCancel?: () => void
}

export const FunderSuggestionForm = ({ onSuccess, onCancel }: FunderSuggestionFormProps) => {
    const [isPending, setIsPending] = React.useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FunderSuggestionFormValues>({
        resolver: zodResolver(funderSuggestionSchema),
        defaultValues: {
            name: "",
            allias: "",
            text_color: "white",
            allias_color: "#1c64f2",
        },
    })

    const currentColor = watch("allias_color") || "#1c64f2"

    const onSubmit = async (data: FunderSuggestionFormValues) => {
        setIsPending(true)
        try {
            await createFunderSuggestion({
                name: data.name,
                allias: data.allias,
                allias_color: data.allias_color || "#1c64f2",
                text_color: data.text_color,
            })
            
            toast.success("Funder suggestion submitted successfully")

            if (onSuccess) {
                onSuccess()
            }
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

            <div className="space-y-4">
                <h3 className="text-white font-medium">Alias Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="allias_color" className="text-white">
                            Background Color
                        </Label>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={currentColor}
                                    onChange={(e) => setValue("allias_color", e.target.value)}
                                    className="h-10 w-20 cursor-pointer bg-gray-800 border border-gray-700 rounded p-0"
                                />
                                <Input
                                    {...register("allias_color")}
                                    className="bg-gray-800 border-gray-700 text-white flex-1"
                                    placeholder="#1c64f2"
                                />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
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

                    <div className="space-y-2">
                        <Label className="text-white">Text Color</Label>
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="textColorBlack"
                                    value="black"
                                    {...register("text_color")}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="textColorBlack" className="text-white cursor-pointer">Black</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="textColorWhite"
                                    value="white"
                                    {...register("text_color")}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="textColorWhite" className="text-white cursor-pointer">White</Label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onCancel && onCancel()}
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
                    Submit Suggestion
                </Button>
            </div>
        </form>
    )
}
