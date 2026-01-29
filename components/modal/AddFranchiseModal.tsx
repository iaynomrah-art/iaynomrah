"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFranchise } from "@/helper/franchise";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddFranchiseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddFranchiseModal = ({ isOpen, onClose, onSuccess }: AddFranchiseModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        investor_name: "",
        description: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const generateCode = () => {
        if (formData.name) {
            // Simple generation: first 3 letters of name uppercased + random number
            const prefix = formData.name.substring(0, 3).toUpperCase();
            const random = Math.floor(100 + Math.random() * 900);
            setFormData(prev => ({ ...prev, code: `${prefix}-${random}` }));
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.code || !formData.investor_name) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            await createFranchise(formData);
            toast.success("Franchise created successfully");
            setFormData({
                name: "",
                code: "",
                investor_name: "",
                description: "",
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error creating franchise:", error);
            toast.error(error.message || "Failed to create franchise");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0A0A0A] border-gray-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Franchise</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Franchise Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Alpha Ventures"
                            value={formData.name}
                            onChange={handleChange}
                            className="bg-[#111111] border-gray-800 focus:border-blue-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="code">Franchise Code</Label>
                            <button
                                type="button"
                                onClick={generateCode}
                                className="text-xs text-blue-500 hover:text-blue-400"
                            >
                                Generate
                            </button>
                        </div>
                        <Input
                            id="code"
                            name="code"
                            placeholder="e.g. ALP-101"
                            value={formData.code}
                            onChange={handleChange}
                            className="bg-[#111111] border-gray-800 focus:border-blue-600 uppercase"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="investor_name">Investor Name</Label>
                        <Input
                            id="investor_name"
                            name="investor_name"
                            placeholder="e.g. John Doe"
                            value={formData.investor_name}
                            onChange={handleChange}
                            className="bg-[#111111] border-gray-800 focus:border-blue-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Brief description..."
                            value={formData.description}
                            onChange={handleChange}
                            className="bg-[#111111] border-gray-800 focus:border-blue-600 min-h-[80px]"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={loading}
                            className="hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Franchise"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
