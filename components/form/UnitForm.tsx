"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Unit, UnitStatus } from "@/types/units"
import { Franchise } from "@/types/franchise"
import { getFranchises } from "@/helper/franchise"
import { createUnit, updateUnit, getUnits } from "@/helper/units"
import { toast } from "sonner"
import { Loader2, ExternalLink, Pencil, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface UnitFormProps {
    initialData?: Unit | null
    onSuccess: () => void
    franchises?: Franchise[]
    units?: Unit[]
}

const UNIT_STATUSES: UnitStatus[] = ["enabled", "disabled", "processing", "slow network", "not connected", "pc issue"]

export function UnitForm({ initialData, onSuccess, franchises: initialFranchises, units: initialUnits }: UnitFormProps) {
    const isEditing = !!initialData
    const [isLoading, setIsLoading] = useState(false)
    const [isNameEditable, setIsNameEditable] = useState(!initialData)
    const [showConfirm, setShowConfirm] = useState(false)
    const [franchises, setFranchises] = useState<Franchise[]>(initialFranchises || [])
    const [units, setUnits] = useState<Unit[]>(initialUnits || [])

    const [formData, setFormData] = useState({
        unit_name: initialData?.unit_name || "",
        franchise_id: initialData?.franchise_id || "",
        status: initialData?.status || "disabled" as UnitStatus,
        mobile_number: initialData?.mobile_number || "",
    })

    useEffect(() => {
        if (!initialFranchises || !initialUnits) {
            const fetchData = async () => {
                const [franchiseData, unitData] = await Promise.all([
                    !initialFranchises ? getFranchises() : Promise.resolve(initialFranchises),
                    !initialUnits ? getUnits() : Promise.resolve(initialUnits)
                ])
                if (!initialFranchises) setFranchises(franchiseData)
                if (!initialUnits) setUnits(unitData)
            }
            fetchData()
        }
    }, [initialFranchises, initialUnits])

    const selectedFranchise = franchises.find(f => f.id === formData.franchise_id)
    const franchiseUnits = units.filter(u => u.franchise_id === formData.franchise_id)
    const nextNumber = isEditing ? 0 : (() => {
        const numbers = franchiseUnits
            .map(u => {
                const parts = u.unit_name.split("-UNIT-")
                return parts.length > 1 ? parseInt(parts[1]) : 0
            })
            .filter(n => !isNaN(n))
        return Math.max(0, ...numbers) + 1
    })()
    const previewName = selectedFranchise ? `${selectedFranchise.code}-UNIT-${nextNumber}` : ""

    useEffect(() => {
        if (!isEditing && previewName) {
            setFormData(prev => ({ ...prev, unit_name: previewName }))
        }
    }, [previewName, isEditing])

    const executeSubmit = async () => {
        setIsLoading(true)

        try {
            const payload = {
                ...formData,
                mobile_number: formData.mobile_number.trim() === "" ? null : formData.mobile_number.trim()
            }

            if (isEditing && initialData) {
                await updateUnit(initialData.id, payload)
                toast.success("Unit updated successfully")
            } else {
                await createUnit(payload)
                toast.success("Unit created successfully")
            }
            onSuccess()
        } catch (error: any) {
            console.error("Error saving unit:", error)
            toast.error(error.message || "Failed to save unit")
        } finally {
            setIsLoading(false)
            setShowConfirm(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const trimmedNumber = formData.mobile_number.trim()
        const finalMobileNumber = trimmedNumber === "" ? null : trimmedNumber

        if (finalMobileNumber) {
            const phMobileRegex = /^(09|\+639)\d{9}$/
            if (!phMobileRegex.test(finalMobileNumber)) {
                toast.error("Invalid mobile number format. Use 09xxxxxxxxx or +639xxxxxxxxx")
                return
            }

            const isDuplicate = units.some((u) => 
                u.id !== initialData?.id && 
                !u.archived && 
                u.mobile_number === finalMobileNumber
            )

            if (isDuplicate) {
                toast.error("This mobile number is already assigned to another active unit.")
                return
            }
        }

        if (isEditing && formData.unit_name !== initialData?.unit_name && !showConfirm) {
            setShowConfirm(true)
            return
        }

        executeSubmit()
    }


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="unit_name">Unit Name</Label>
                    <div className="flex gap-2">
                        <Input
                            id="unit_name"
                            placeholder="e.g. Unit 01"
                            value={formData.unit_name}
                            onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                            required
                            disabled={!isNameEditable}
                            className="bg-[#050505] border-[#1a1a1a] focus:border-blue-500/50 disabled:opacity-50 flex-1"
                        />
                        {isEditing && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setIsNameEditable(!isNameEditable)}
                                className="border-[#1a1a1a] bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400"
                                title="Edit Unit Name"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    {!isEditing && previewName && (
                        <p className="text-[10px] text-blue-500/80 font-medium">
                            Preview: <span className="text-blue-400">{previewName}</span>
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="franchise_id">Franchise</Label>
                    <select
                        id="franchise_id"
                        value={formData.franchise_id || ""}
                        onChange={(e) => setFormData({ ...formData, franchise_id: e.target.value })}
                        required
                        className="flex h-10 w-full rounded-md border border-[#1a1a1a] bg-[#050505] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500/50"
                    >
                        <option value="" disabled>Select a franchise</option>
                        {franchises.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.name} ({f.code})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="mobile_number">Mobile Number (Optional)</Label>
                    <Input
                        id="mobile_number"
                        type="tel"
                        placeholder="e.g. 09171234567 or +639171234567"
                        value={formData.mobile_number}
                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                        disabled={isLoading}
                        className="bg-[#050505] border-[#1a1a1a] focus:border-blue-500/50 disabled:cursor-not-allowed text-white"
                    />
                    <p className="text-[10px] text-muted-foreground">
                        Must be a unique Philippine mobile number (0917xxxxxxx or +63917xxxxxxx). Can be left blank.
                    </p>
                </div>



                {isEditing && (
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            value={formData.status || ""}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as UnitStatus })}
                            className="flex h-10 w-full rounded-md border border-[#1a1a1a] bg-[#050505] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500/50"
                        >
                            {UNIT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status.charAt(0) + status.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {showConfirm ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4 mt-6">
                    <div className="flex items-center gap-3 text-amber-500 mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <h4 className="font-semibold text-sm">Confirm Name Change</h4>
                    </div>
                    <p className="text-sm text-amber-200/80 mb-4">
                        Are you sure you want to change the unit name from <strong className="text-white">{initialData?.unit_name}</strong> to <strong className="text-white">{formData.unit_name}</strong>? This might affect existing integrations or reporting.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowConfirm(false)}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={executeSubmit}
                            disabled={isLoading}
                            className="bg-amber-600 hover:bg-amber-500 text-white min-w-[120px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Yes, Update Name"
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3 pt-4 justify-end">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            isEditing ? "Update Unit" : "Add Unit"
                        )}
                    </Button>
                </div>
            )}
        </form>
    )
}
