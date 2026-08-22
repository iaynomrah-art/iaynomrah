"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PackageForm } from "@/components/form/PackageForm"
import { Funder } from "@/types/funder"

interface PackageModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: any | null
    funders: Funder[]
    accounts: any[]
}

export function PackageModal({ isOpen, onClose, onSuccess, initialData, funders, accounts = [] }: PackageModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Update Package' : 'Add New Package'}</DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                    <PackageForm
                        key={initialData?.id || 'new'}
                        initialData={initialData}
                        funders={funders}
                        accounts={accounts}
                        onSuccess={onSuccess}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
