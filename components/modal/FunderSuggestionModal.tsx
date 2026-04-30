"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FunderSuggestionForm } from "@/components/form/FunderSuggestionForm"

interface FunderSuggestionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function FunderSuggestionModal({ isOpen, onClose, onSuccess }: FunderSuggestionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Suggest New Funder</DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                    <FunderSuggestionForm
                        onSuccess={onSuccess}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
