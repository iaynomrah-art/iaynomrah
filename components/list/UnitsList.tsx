import React from 'react'
import { Unit } from '@/types/units'
import { UnitCard } from '../card/CardUnit'

interface UnitWithCounts extends Unit {
    funder_counts?: {
        allias: string;
        count: number;
        allias_color: string;
        text_color: string;
    }[];
}

interface UnitsListProps {
    units: UnitWithCounts[];
    onEdit?: (unit: Unit) => void;
    onArchive?: (id: string, name: string) => void;
    onStatusChange?: (id: string, status: any) => void;
    role: string | null;
}

const UnitsList = ({ units, onEdit, onArchive, onStatusChange, role }: UnitsListProps) => {
    if (!units || units.length === 0) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-800 bg-gray-950/50 p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-900">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-6 w-6 text-gray-500"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                        />
                    </svg>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-gray-200">No units found</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new unit functionality.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-6">
            {units.map((unit) => (
                <UnitCard
                    key={unit.id}
                    id={unit.id}
                    code={unit.unit_name}
                    shortName={unit.franchise?.code || "UN"}
                    guid={unit.unit_id}
                    company={unit.franchise?.name || undefined}
                    status={unit.status || "disabled"}
                    serial={unit.unit_id?.split("-")[0].toUpperCase() || "N/A"} // Using part of UUID as serial for display
                    owner={unit.franchise?.name || "Unknown"}
                    accentColor={(unit.franchise as any)?.color || "border-gray-600"}
                    badgeBg={(unit.franchise as any)?.color?.replace('border', 'bg').replace('500', '600') || "bg-gray-600"}
                    badgeText="text-white"
                    tags={unit.funder_counts?.map(fc => ({
                        label: fc.allias,
                        count: fc.count,
                        bgColor: fc.allias_color,
                        textColor: fc.text_color
                    }))}
                    onEdit={() => onEdit?.(unit)}
                    onArchive={onArchive}
                    onStatusChange={onStatusChange}
                    role={role}
                />
            ))}
        </div>
    )
}

export default UnitsList