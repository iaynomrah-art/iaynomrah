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
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"

interface LoginConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

export const LoginConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm
}: LoginConfirmationModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#1e2329] border-[#2b3139] text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="bg-blue-500/20 p-2 rounded-full">
                            <Lock className="w-5 h-5 text-blue-500" />
                        </div>
                        Authentication Required
                    </DialogTitle>
                    <DialogDescription className="text-[#848e9c]">
                        Please enter your account credentials to authorize this trading action.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-[#848e9c]">Email / Username</label>
                        <Input 
                            placeholder="Enter your email" 
                            className="bg-[#0b0e11] border-[#2b3139] text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-[#848e9c]">Master Password</label>
                        <Input 
                            type="password"
                            placeholder="Enter master password" 
                            className="bg-[#0b0e11] border-[#2b3139] text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0 mt-2 border-t border-[#2b3139] pt-4">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="bg-[#2a2e33] hover:bg-[#3a3e43] text-[#848e9c]"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={onConfirm}
                        className="bg-[#2f66d4] hover:bg-[#3b7ef6] text-white"
                    >
                        Authorize & Proceed
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
