"use client"

import React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Unit {
    id: number
    unit_name: string
    api_base_url?: string
    created_at: string
    franchise?: {
        name: string
        [key: string]: any
    } | null
    [key: string]: any
}

interface UnitsTableProps {
    data: any[]
}

export const UnitsTable = ({ data }: UnitsTableProps) => {
    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm pb-4">UNIT NAME</TableHead>
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">FRANCHISE</TableHead>
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">API BASE URL</TableHead>
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                No units found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((unit) => (
                            <TableRow key={unit.id} className="border-[#1a1a1a] hover:bg-[#111] transition-colors">
                                <TableCell className="text-white py-4 font-medium text-sm">
                                    {unit.unit_name || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm">
                                    {unit.franchise?.name || "-"}
                                </TableCell>
                                <TableCell className="text-white py-4 text-sm font-mono">
                                    {unit.api_base_url || "-"}
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-white transition-colors">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#262626] text-muted-foreground hover:text-red-500 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export const UnitsTableSkeleton = () => {
    return (
        <div className="w-full">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm pb-4">UNIT NAME</TableHead>
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">FRANCHISE</TableHead>
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm whitespace-nowrap pb-4">API BASE URL</TableHead>
                        <TableHead className="w-1/4 text-muted-foreground font-medium text-sm pb-4">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i} className="border-[#1a1a1a] hover:bg-transparent">
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[150px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[100px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-4 w-[200px] bg-[#1a1a1a]" />
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md bg-[#1a1a1a]" />
                                    <Skeleton className="h-8 w-8 rounded-md bg-[#1a1a1a]" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
