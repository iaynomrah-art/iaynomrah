"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Unit, UnitStatus, RouterCredentials } from "@/types/units"
import { Franchise } from "@/types/franchise"
import { getFranchises } from "@/helper/franchise"
import { createUnit, updateUnit, getUnits } from "@/helper/units"
import { getRouterCredentials, saveRouterCredentials } from "@/lib/router-actions"
import { toast } from "sonner"
import { Loader2, ExternalLink, Pencil, AlertTriangle, Server, Router, Eye, EyeOff, Copy, Check } from "lucide-react"
import Link from "next/link"

const ROUTER_ADMIN_URL = "http://192.168.254.254"
const GOMO_LOGIN_URL = "https://www.gomo.ph/login"

type RouterForm = Omit<RouterCredentials, "updated_at">
const EMPTY_ROUTER: RouterForm = { router_username: "", router_password: "", gomo_email: "", gomo_password: "" }

interface UnitFormProps {
    initialData?: Unit | null
    onSuccess: () => void
    franchises?: Franchise[]
    units?: Unit[]
}

const UNIT_STATUSES: UnitStatus[] = ["enabled", "disabled", "processing", "slow network", "not connected", "pc issue"]

export function UnitForm({ initialData, onSuccess, franchises: initialFranchises, units: initialUnits }: UnitFormProps) {
    const isEditing = !!initialData
    const [isLoading, setIsLoading] = useState(false)
    const [isNameEditable, setIsNameEditable] = useState(!initialData)
    const [showConfirm, setShowConfirm] = useState(false)
    const [franchises, setFranchises] = useState<Franchise[]>(initialFranchises || [])
    const [units, setUnits] = useState<Unit[]>(initialUnits || [])
    const [tab, setTab] = useState("unit")
    const [router, setRouter] = useState<RouterForm>(EMPTY_ROUTER)
    const [routerSaved, setRouterSaved] = useState<RouterForm>(EMPTY_ROUTER)
    const [routerLoading, setRouterLoading] = useState(isEditing)
    const [routerError, setRouterError] = useState<string | null>(null)

    // Router logins live in a super-admin-only table, loaded separately from the unit
    useEffect(() => {
        if (!initialData) return
        let cancelled = false
        getRouterCredentials(initialData.id).then((result) => {
            if (cancelled) return
            setRouterLoading(false)
            if (result.error) {
                setRouterError(result.error)
                return
            }
            const loaded: RouterForm = {
                router_username: result.data?.router_username || "",
                router_password: result.data?.router_password || "",
                gomo_email: result.data?.gomo_email || "",
                gomo_password: result.data?.gomo_password || "",
            }
            setRouter(loaded)
            setRouterSaved(loaded)
        })
        return () => { cancelled = true }
    }, [initialData])

    const [formData, setFormData] = useState({
        unit_name: initialData?.unit_name || "",
        franchise_id: initialData?.franchise_id || "",
        status: initialData?.status || "disabled" as UnitStatus,
        mobile_number: initialData?.mobile_number || "",
    })

    useEffect(() => {
        if (!initialFranchises || !initialUnits) {
            const fetchData = async () => {
                const [franchiseData, unitData] = await Promise.all([
                    !initialFranchises ? getFranchises() : Promise.resolve(initialFranchises),
                    !initialUnits ? getUnits() : Promise.resolve(initialUnits)
                ])
                if (!initialFranchises) setFranchises(franchiseData)
                if (!initialUnits) setUnits(unitData)
            }
            fetchData()
        }
    }, [initialFranchises, initialUnits])

    const selectedFranchise = franchises.find(f => f.id === formData.franchise_id)
    const franchiseUnits = units.filter(u => u.franchise_id === formData.franchise_id)
    const nextNumber = isEditing ? 0 : (() => {
        const numbers = franchiseUnits
            .map(u => {
                const parts = u.unit_name.split("-UNIT-")
                return parts.length > 1 ? parseInt(parts[1]) : 0
            })
            .filter(n => !isNaN(n))
        return Math.max(0, ...numbers) + 1
    })()
    const previewName = selectedFranchise ? `${selectedFranchise.code}-UNIT-${nextNumber}` : ""

    useEffect(() => {
        if (!isEditing && previewName) {
            setFormData(prev => ({ ...prev, unit_name: previewName }))
        }
    }, [previewName, isEditing])

    const executeSubmit = async () => {
        setIsLoading(true)

        try {
            const payload = {
                ...formData,
                mobile_number: formData.mobile_number.trim() === "" ? null : formData.mobile_number.trim()
            }

            let unitId: string | undefined
            if (isEditing && initialData) {
                await updateUnit(initialData.id, payload)
                unitId = initialData.id
            } else {
                const created = await createUnit(payload)
                unitId = created?.[0]?.id
            }

            const routerChanged = (Object.keys(router) as (keyof RouterForm)[])
                .some((k) => (router[k] || "").trim() !== (routerSaved[k] || "").trim())
            if (routerChanged && unitId && !routerError) {
                const result = await saveRouterCredentials(unitId, router)
                if (result.error) {
                    // The unit itself is saved; keep the form open so the router details aren't lost
                    toast.error(`Unit saved, but router details weren't: ${result.error}`)
                    setTab("router")
                    return
                }
                setRouterSaved(router)
            }

            toast.success(isEditing ? "Unit updated successfully" : "Unit created successfully")
            onSuccess()
        } catch (error: any) {
            console.error("Error saving unit:", error)
            toast.error(error.message || "Failed to save unit")
        } finally {
            setIsLoading(false)
            setShowConfirm(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Fields on the inactive tab aren't rendered, so the browser can't check them
        if (!formData.unit_name.trim() || !formData.franchise_id) {
            toast.error("Unit name and franchise are required")
            setTab("unit")
            return
        }

        const trimmedNumber = formData.mobile_number.trim()
        const finalMobileNumber = trimmedNumber === "" ? null : trimmedNumber

        if (finalMobileNumber) {
            const phMobileRegex = /^(09|\+639)\d{9}$/
            if (!phMobileRegex.test(finalMobileNumber)) {
                toast.error("Invalid mobile number format. Use 09xxxxxxxxx or +639xxxxxxxxx")
                setTab("router")
                return
            }

            const isDuplicate = units.some((u) => 
                u.id !== initialData?.id && 
                !u.archived && 
                u.mobile_number === finalMobileNumber
            )

            if (isDuplicate) {
                toast.error("This mobile number is already assigned to another active unit.")
                setTab("router")
                return
            }
        }

        if (isEditing && formData.unit_name !== initialData?.unit_name && !showConfirm) {
            setShowConfirm(true)
            return
        }

        executeSubmit()
    }


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={tab} onValueChange={setTab} className="space-y-4">
                <TabsList className="bg-[#111111] border border-gray-800 p-1 w-full">
                    <TabsTrigger value="unit" className="flex-1 text-gray-400 hover:text-gray-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <Server className="h-4 w-4 mr-2" />
                        Unit
                    </TabsTrigger>
                    <TabsTrigger value="router" className="flex-1 text-gray-400 hover:text-gray-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <Router className="h-4 w-4 mr-2" />
                        Router
                    </TabsTrigger>
                </TabsList>

            {/* Fixed height so the dialog doesn't jump between tabs; scrolls on short screens */}
            <div className="h-[540px] max-h-[60vh] overflow-y-auto pr-1 -mr-1">
            <TabsContent value="unit" className="space-y-4 mt-0">
                <div className="space-y-2">
                    <Label htmlFor="unit_name">Unit Name</Label>
                    <div className="flex gap-2">
                        <Input
                            id="unit_name"
                            placeholder="e.g. Unit 01"
                            value={formData.unit_name}
                            onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                            required
                            disabled={!isNameEditable}
                            className="bg-[#050505] border-[#1a1a1a] focus:border-blue-500/50 disabled:opacity-50 flex-1"
                        />
                        {isEditing && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setIsNameEditable(!isNameEditable)}
                                className="border-[#1a1a1a] bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400"
                                title="Edit Unit Name"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    {!isEditing && previewName && (
                        <p className="text-[10px] text-blue-500/80 font-medium">
                            Preview: <span className="text-blue-400">{previewName}</span>
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="franchise_id">Franchise</Label>
                    <select
                        id="franchise_id"
                        value={formData.franchise_id || ""}
                        onChange={(e) => setFormData({ ...formData, franchise_id: e.target.value })}
                        required
                        className="flex h-10 w-full rounded-md border border-[#1a1a1a] bg-[#050505] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500/50"
                    >
                        <option value="" disabled>Select a franchise</option>
                        {franchises.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.name} ({f.code})
                            </option>
                        ))}
                    </select>
                </div>

                {isEditing && (
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            value={formData.status || ""}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as UnitStatus })}
                            className="flex h-10 w-full rounded-md border border-[#1a1a1a] bg-[#050505] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500/50"
                        >
                            {UNIT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status.charAt(0) + status.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="router" className="space-y-5 mt-0">
                <section className="space-y-3">
                    <SectionHeading title="GOMO account" url={GOMO_LOGIN_URL} />
                    <div className="space-y-2">
                        <RouterField id="mobile_number" label="Mobile Number (Optional)" placeholder="e.g. 09171234567 or +639171234567"
                            value={formData.mobile_number} disabled={isLoading}
                            onChange={(v) => setFormData({ ...formData, mobile_number: v })} />
                        <p className="text-[10px] text-muted-foreground">
                            The unit&apos;s SIM. Must be a unique Philippine mobile number (0917xxxxxxx or +63917xxxxxxx). Can be left blank.
                        </p>
                    </div>
                    {routerError ? null : (
                        <>
                            <RouterField id="gomo_email" label="Email" value={router.gomo_email} loading={routerLoading} disabled={isLoading}
                                onChange={(v) => setRouter({ ...router, gomo_email: v })} />
                            <RouterField id="gomo_password" label="PIN" secret value={router.gomo_password} loading={routerLoading} disabled={isLoading}
                                onChange={(v) => setRouter({ ...router, gomo_password: v })} />
                        </>
                    )}
                </section>

                <section className="space-y-3">
                    <SectionHeading title="Router admin panel" url={ROUTER_ADMIN_URL} />
                    {routerError ? (
                        <p className="text-xs text-amber-400">{routerError}</p>
                    ) : (
                        <>
                            <RouterField id="router_username" label="Username" placeholder="e.g. admin" value={router.router_username} loading={routerLoading} disabled={isLoading}
                                onChange={(v) => setRouter({ ...router, router_username: v })} />
                            <RouterField id="router_password" label="Password" secret value={router.router_password} loading={routerLoading} disabled={isLoading}
                                onChange={(v) => setRouter({ ...router, router_password: v })} />
                            <p className="text-[10px] text-muted-foreground">
                                The admin panel only opens from a PC connected to this unit&apos;s router.
                            </p>
                        </>
                    )}
                </section>
            </TabsContent>
            </div>
            </Tabs>

            {showConfirm ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4 mt-6">
                    <div className="flex items-center gap-3 text-amber-500 mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <h4 className="font-semibold text-sm">Confirm Name Change</h4>
                    </div>
                    <p className="text-sm text-amber-200/80 mb-4">
                        Are you sure you want to change the unit name from <strong className="text-white">{initialData?.unit_name}</strong> to <strong className="text-white">{formData.unit_name}</strong>? This might affect existing integrations or reporting.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowConfirm(false)}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={executeSubmit}
                            disabled={isLoading}
                            className="bg-amber-600 hover:bg-amber-500 text-white min-w-[120px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Yes, Update Name"
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3 pt-4 justify-end">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            isEditing ? "Update Unit" : "Add Unit"
                        )}
                    </Button>
                </div>
            )}
        </form>
    )
}

function SectionHeading({ title, url }: { title: string; url: string }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 font-mono"
            >
                {url.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3" />
            </a>
        </div>
    )
}

function RouterField({ id, label, value, onChange, secret, placeholder, disabled, loading }: {
    id: string
    label: string
    value: string | null
    onChange: (value: string) => void
    secret?: boolean
    placeholder?: string
    disabled?: boolean
    loading?: boolean
}) {
    const [revealed, setRevealed] = useState(false)
    const [copied, setCopied] = useState(false)

    const copy = async () => {
        if (!value) return
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            toast.error("Failed to copy")
        }
    }

    if (loading) {
        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <Skeleton className="h-10 w-full bg-[#1a1a1a]" />
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input
                    id={id}
                    type={secret && !revealed ? "password" : "text"}
                    autoComplete={secret ? "new-password" : "off"}
                    placeholder={placeholder}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={`bg-[#050505] border-[#1a1a1a] focus:border-blue-500/50 disabled:opacity-50 text-white font-mono ${secret ? "pr-16" : "pr-10"}`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {secret && (
                        <button
                            type="button"
                            title={revealed ? "Hide" : "Show"}
                            onClick={() => setRevealed(!revealed)}
                            className="p-1 text-gray-500 hover:text-white"
                        >
                            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    )}
                    <button
                        type="button"
                        title="Copy"
                        onClick={copy}
                        disabled={!value}
                        className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                    >
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </div>
    )
}
