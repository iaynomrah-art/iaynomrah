"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { UnitForm } from "../../form/UnitForm"
import { Unit } from "@/types/units"
import { Franchise } from "@/types/franchise"
import Link from "next/link"

interface UnitModalProps {
    isOpen: boolean
    onClose: () => void
    initialData?: Unit | null
    onSuccess?: () => void
    franchises?: Franchise[]
    units?: Unit[]
}

export function UnitModal({ isOpen, onClose, initialData, onSuccess, franchises, units }: UnitModalProps) {
    const isEditing = !!initialData

    const handleSuccess = () => {
        if (onSuccess) onSuccess()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Unit" : "Add New Unit"}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isEditing
                            ? "Modify the unit configuration below."
                            : "Create a new unit by filling out the form below."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <UnitForm
                        initialData={initialData}
                        onSuccess={handleSuccess}
                        franchises={franchises}
                        units={units}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
