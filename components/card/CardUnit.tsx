"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { broadcastToUnit } from "@/helper/realtime";

import {
    Pencil,
    Archive,
    CircleCheck,
    ChevronDown,
    Loader2,
    WifiLow,
    Unplug,
    MonitorOff,
    CircleOff,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UnitStatus } from "@/types/units";

export interface UnitTag {
    label: string;
    count: number;
    bgColor: string;
    textColor?: string;
}


export interface UnitCardProps {
    id: string;
    code: string;           // MJ-9
    shortName: string;      // MJ
    guid?: string | null;
    company?: string;       // View Plus
    status: UnitStatus;
    serial: string;         // 20D7CBBF
    owner: string;
    accentColor: string;    // purple-500, teal-500
    badgeBg: string;        // purple-600
    badgeText: string;      // purple-100
    tags?: UnitTag[];
    onStatusChange?: (id: string, status: UnitStatus) => void;
    onArchive?: (id: string, name: string) => void;
    onEdit?: (id: string) => void;
    role: string | null;
}

export function UnitCard({
    id,
    code,
    shortName,
    guid,
    company,
    status,
    serial,
    owner,
    accentColor,
    badgeBg,
    badgeText,
    tags = [],
    onStatusChange,
    onArchive,
    onEdit,
    role
}: UnitCardProps) {
    const [isPinging, setIsPinging] = useState(false);
    const [isCheckingHealth, setIsCheckingHealth] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkHealth = async () => {
            if (!guid) {
                if (isMounted) setIsCheckingHealth(false);
                return;
            }
            
            try {
                await broadcastToUnit({
                    unitId: guid,
                    event: 'ping',
                    timeoutMs: 5000
                });
                if (isMounted) {
                    setIsCheckingHealth(false);
                    if (status !== 'enabled') {
                        onStatusChange?.(id, 'enabled');
                    }
                }
            } catch (error) {
                if (isMounted) {
                    setIsCheckingHealth(false);
                    if (status !== 'not connected') {
                        onStatusChange?.(id, 'not connected');
                    }
                }
            }
        };

        checkHealth();

        return () => {
            isMounted = false;
        };
    }, [guid]); // run once per guid

    const handlePing = async () => {
        if (!guid) {
            toast.error("No remote connection. Please set up the unit first.");
            return;
        }
        setIsPinging(true);
        const toastId = toast.loading(`Pinging ${code}...`);
        try {
            await broadcastToUnit({
                unitId: guid,
                event: 'ping',
                timeoutMs: 10000
            });
            toast.success("Pong! Unit is online and responding.", { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Failed to ping unit.", { id: toastId });
        } finally {
            setIsPinging(false);
        }
    };

    const getStatusConfig = (status: UnitStatus) => {
        switch (status) {
            case "enabled":
                return { icon: CircleCheck, color: "text-green-500", label: "Enabled" };
            case "processing":
                return { icon: Loader2, color: "text-amber-500 animate-spin", label: "Processing" };
            case "slow network":
                return { icon: WifiLow, color: "text-orange-500", label: "Slow Network" };
            case "not connected":
                return { icon: Unplug, color: "text-red-500", label: "Not Connected" };
            case "pc issue":
                return { icon: MonitorOff, color: "text-red-500", label: "PC Issue" };
            case "disabled":
                return { icon: CircleOff, color: "text-gray-500", label: "Disabled" };
            default:
                return { icon: CircleOff, color: "text-gray-500", label: "Unknown" };
        }
    };

    const config = getStatusConfig(status);
    const StatusIcon = config.icon;

    const statuses: UnitStatus[] = ["enabled", "processing", "slow network", "not connected", "pc issue", "disabled"];
    return (
        <div
            className={cn(
                "border text-card-foreground shadow hover:border-gray-600 transition-colors rounded-lg bg-gray-800 border-l-4",
                accentColor
            )}
        >
            <div className="p-6">
                {/* Badge */}
                <div className="flex justify-end mb-2 min-h-[28px]">
                    <span
                        className={cn(
                            "text-xs font-bold px-2 py-1 rounded",
                            badgeBg,
                            badgeText
                        )}
                        title={company}
                    >
                        {shortName}
                    </span>
                </div>



                {/* Code */}
                <div className="text-center mb-2">
                    <div className="font-bold text-2xl font-mono text-white">
                        {code}
                    </div>
                    <div className="min-h-[16px]">
                        {company && (
                            <div className="text-xs mt-1 text-gray-400">{company}</div>
                        )}
                    </div>
                </div>

                {/* Serial */}
                <div className="text-center mb-4">
                    <div className="text-sm font-mono text-gray-400">{serial}</div>
                </div>

                {/* Owner */}
                <div className="text-center mb-4 min-h-[24px]">
                    <div className="text-sm font-medium text-gray-300">{owner}</div>
                </div>

                <div className="border-t border-gray-700 mb-4" />

                {/* Tags */}
                <div className="mb-4 min-h-[80px] flex flex-col justify-start">
                    <div className="space-y-3">
                        {tags.map((tag, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 w-full justify-center"
                            >
                                <span
                                    className="font-bold px-2 py-1 rounded text-xs inline-flex items-center justify-center min-w-[60px]"
                                    style={{
                                        backgroundColor: tag.bgColor,
                                        color: tag.textColor ?? "white",
                                    }}
                                >
                                    {tag.label}
                                </span>
                                <span className="text-sm text-white">{tag.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-700 mb-4" />

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-gray-700 gap-2 px-2"
                                disabled={isCheckingHealth}
                            >
                                {isCheckingHealth ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                        <span className="text-xs font-medium text-gray-400 capitalize">Checking...</span>
                                    </>
                                ) : (
                                    <>
                                        <StatusIcon className={cn("w-4 h-4", config.color)} />
                                        <span className="text-xs font-medium text-gray-400 capitalize">{status}</span>
                                        <ChevronDown className="w-3 h-3 text-gray-500" />
                                    </>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-gray-800 border-gray-700 text-white">
                            {statuses.map((s) => {
                                const sCfg = getStatusConfig(s);
                                const SIcon = sCfg.icon;
                                return (
                                    <DropdownMenuItem
                                        key={s}
                                        className="hover:bg-gray-700 cursor-pointer gap-2"
                                        onClick={() => onStatusChange?.(id, s)}
                                    >
                                        <SIcon className={cn("w-4 h-4", sCfg.color)} />
                                        <span className="capitalize">{s}</span>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {role === 'super-admin' && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Health Check"
                                className="text-white hover:bg-gray-700"
                                onClick={handlePing}
                                disabled={isPinging}
                            >
                                {isPinging ? <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> : <Activity className="h-4 w-4" />}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                title="Edit Unit"
                                className="text-white hover:bg-gray-700"
                                onClick={() => onEdit?.(id)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                title="Archive Unit"
                                className="text-white hover:bg-gray-700"
                                onClick={() => onArchive?.(id, code)}
                            >
                                <Archive className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
