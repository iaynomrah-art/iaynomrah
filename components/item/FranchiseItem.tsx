import React from "react";
import { Franchise } from "@/types/franchise";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FranchiseItemProps {
    franchise: Franchise;
}

export const FranchiseItem = ({ franchise }: FranchiseItemProps) => {
    return (
        <Card className="bg-[#111111] border-gray-800 hover:border-gray-700 transition-all">
            <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-white font-medium">{franchise.name}</h3>
                        <p className="text-sm text-gray-400">{franchise.investor_name}</p>
                    </div>
                    <Badge variant="outline" className="text-blue-400 border-blue-400/20 bg-blue-400/10">
                        {franchise.code}
                    </Badge>
                </div>
                {franchise.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                        {franchise.description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
