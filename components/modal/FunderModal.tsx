"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FunderForm } from "@/components/form/FunderForm"
import { Funder } from "@/types/funder"

interface FunderModalProps {
    isOpen: boolean
    onClose: () => void
    initialData?: Funder | null
}

export function FunderModal({ isOpen, onClose, initialData }: FunderModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Update Funder' : 'Add New Funder'}</DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                    <FunderForm
                        key={initialData?.id || 'new'}
                        initialData={initialData}
                        onSuccess={onClose}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
