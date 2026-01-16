"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"

interface DeletePackageModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    packageName: string
    isPending?: boolean
}

export function DeletePackageModal({
    isOpen,
    onClose,
    onConfirm,
    packageName,
    isPending = false
}: DeletePackageModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-[400px]">
                <DialogHeader className="flex flex-col items-center gap-4 py-4">
                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Trash2 className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="space-y-2 text-center">
                        <DialogTitle className="text-xl font-bold">Delete Package?</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">
                            Are you sure you want to delete <span className="text-white font-medium">{packageName}</span>?
                            This action cannot be undone.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-200/80 leading-relaxed">
                        Deleting this package will permanently remove it from the system.
                        Please ensure no accounts are currently using this package.
                    </p>
                </div>

                <DialogFooter className="flex gap-3 sm:justify-center">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 hover:bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#1a1a1a]"
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                        disabled={isPending}
                    >
                        {isPending ? "Deleting..." : "Delete Package"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
