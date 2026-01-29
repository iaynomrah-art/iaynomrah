"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { getFranchises } from "@/helper/franchise";
import { Franchise } from "@/types/franchise";
import { FranchiseList } from "@/components/list/FranchiseList";
import { AddFranchiseModal } from "@/components/modal/AddFranchiseModal";

interface FranchiseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FranchiseModal = ({ isOpen, onClose }: FranchiseModalProps) => {
    const [franchises, setFranchises] = useState<Franchise[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchFranchises = async () => {
        setLoading(true);
        try {
            const data = await getFranchises();
            setFranchises(data || []);
        } catch (error) {
            console.error("Failed to fetch franchises", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchFranchises();
        }
    }, [isOpen]);

    const filteredFranchises = franchises.filter((f) => {
        const query = searchQuery.toLowerCase();
        return (
            (f.name && f.name.toLowerCase().includes(query)) ||
            (f.code && f.code.toLowerCase().includes(query)) ||
            (f.investor_name && f.investor_name.toLowerCase().includes(query))
        );
    });

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="bg-[#050505] border-gray-800 text-white sm:max-w-xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <div className="p-6 border-b border-gray-800/50 space-y-4 bg-[#0A0A0A]">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-bold">Franchise List</DialogTitle>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search franchise..."
                                    className="pl-9 bg-[#111111] border-gray-800 focus:border-blue-600"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Franchise
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto bg-[#050505]">
                        {loading ? (
                            <div className="flex justify-center items-center h-full text-gray-500">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                Loading...
                            </div>
                        ) : (
                            <FranchiseList franchises={filteredFranchises} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AddFranchiseModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchFranchises}
            />
        </>
    );
};
