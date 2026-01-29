"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PackageForm } from "@/components/form/PackageForm"
import { Funder } from "@/types/funder" // Assuming Funder type is here

interface PackageModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: any | null
    funders: Funder[]
}

export function PackageModal({ isOpen, onClose, onSuccess, initialData, funders }: PackageModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Update Package' : 'Add New Package'}</DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                    <PackageForm
                        key={initialData?.id || 'new'}
                        initialData={initialData}
                        funders={funders}
                        onSuccess={onSuccess}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
