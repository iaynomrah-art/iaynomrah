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
import { Archive, AlertTriangle } from "lucide-react"

interface ArchiveUnitModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    unitName: string
    isPending?: boolean
}

export function ArchiveUnitModal({
    isOpen,
    onClose,
    onConfirm,
    unitName,
    isPending = false
}: ArchiveUnitModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-[400px]">
                <DialogHeader className="flex flex-col items-center gap-4 py-4">
                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Archive className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="space-y-2 text-center">
                        <DialogTitle className="text-xl font-bold">Archive Unit?</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">
                            Are you sure you want to archive <span className="text-white font-medium">{unitName}</span>?
                            This will move the unit to the archives.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                        Archived units will no longer appear in your active units list but can be restored later.
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
                        {isPending ? "Archiving..." : "Archive Unit"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
