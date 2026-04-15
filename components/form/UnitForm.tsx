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
import { Loader2, ExternalLink } from "lucide-react"
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
    const [franchises, setFranchises] = useState<Franchise[]>(initialFranchises || [])
    const [units, setUnits] = useState<Unit[]>(initialUnits || [])

    const [formData, setFormData] = useState({
        unit_name: initialData?.unit_name || "",
        api_base_url: initialData?.api_base_url || "",
        franchise_id: initialData?.franchise_id || "",
        status: initialData?.status || "disabled" as UnitStatus
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Legacy config test removed - communication is now over Supabase Pub/Sub

            if (isEditing && initialData) {
                await updateUnit(initialData.id, formData)
                toast.success("Unit updated successfully")
            } else {
                await createUnit(formData)
                toast.success("Unit created successfully")
            }
            onSuccess()
        } catch (error: any) {
            console.error("Error saving unit:", error)
            toast.error(error.message || "Failed to save unit")
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="unit_name">Unit Name</Label>
                    <Input
                        id="unit_name"
                        placeholder="e.g. Unit 01"
                        value={formData.unit_name}
                        onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                        required
                        disabled
                        className="bg-[#050505] border-[#1a1a1a] focus:border-blue-500/50 opacity-100"
                    />
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
                    <div className="flex items-center gap-2">
                        <Link
                            href={`${formData.api_base_url}`}
                            target="_blank"
                            className="text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 text-[10px] font-medium"
                        >
                            <ExternalLink className="h-3 w-3" />
                            <span>Root</span>
                        </Link>
                        <Label htmlFor="api_base_url">API Base URL</Label>
                    </div>
                    <Input
                        id="api_base_url"
                        placeholder="https://api.example.com"
                        value={formData.api_base_url || ""}
                        onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
                        className="bg-[#050505] border-[#1a1a1a] focus:border-blue-500/50"
                    />
                    <p className="text-[10px] text-muted-foreground">The base URL where the unit API is hosted.</p>
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
        </form>
    )
}
