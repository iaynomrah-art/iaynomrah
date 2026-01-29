import React from "react";
import { Franchise } from "@/types/franchise";
import { FranchiseItem } from "@/components/item/FranchiseItem";

interface FranchiseListProps {
    franchises: Franchise[];
}

export const FranchiseList = ({ franchises }: FranchiseListProps) => {
    if (franchises.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No franchises found
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {franchises.map((franchise) => (
                <FranchiseItem key={franchise.id} franchise={franchise} />
            ))}
        </div>
    );
};
