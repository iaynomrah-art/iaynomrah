"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, Loader2, ChevronDown, Eye, EyeOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createPackage, updatePackage } from "@/helper/package"
import { createCredential, updateCredential } from "@/helper/credentials"
import { createFunderAccount } from "@/helper/funder_accounts"
import { useRouter } from "next/navigation"
import { Funder } from "@/types/funder"
import { toast } from "sonner"
import Swal from "sweetalert2"

const packageSchema = z.object({
    account_id: z.string().min(1, "User is required"),
    platform: z.string().min(1, "Platform is required"),
    platform_id: z.string().min(1, "Platform ID is required"),
    server: z.string().optional(),
    username: z.string().min(1, "Username is required"),
    password: z.string().optional(),
    name: z.string().min(1, "Package name is required"),
    equity: z.string().min(1, "Equity is required"),
    phase: z.string().min(1, "Phase is required"),
    instrument: z.string().min(1, "Instrument is required"),
    purchase_price: z.string().optional(),
    funder_id: z.string().min(1, "Funder is required"),
    max_daily_loss_percent: z.string().optional(),
    max_total_loss_percent: z.string().optional(),
    profit_target_percent: z.string().optional(),
    daily_profit_target_percent: z.string().optional(),
    consistency_rule_percent: z.string().optional(),
})

type PackageFormValues = z.infer<typeof packageSchema>

interface PackageFormProps {
    initialData?: any | null
    funders: Funder[]
    accounts?: any[]
    onSuccess?: () => void
    onCancel?: () => void
}

// Package form accepts metric percentages and stores computed dollar values.
export const PackageForm = ({ initialData, funders, accounts = [], onSuccess, onCancel }: PackageFormProps) => {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState("details")
    const [showPassword, setShowPassword] = React.useState(false)
    const [calculatedValues, setCalculatedValues] = React.useState({
        max_daily_loss: 0,
        max_total_loss: 0,
        profit_target: 0,
        daily_profit_target: 0,
    })

    const isUpdate = !!initialData

    // Calculate percentages from existing dollar amounts when editing old records.
    const getDefaultPercentageValue = (dollarAmount: number, equity: number) => {
        if (!dollarAmount || !equity || equity === 0) return ""
        return ((dollarAmount / equity) * 100).toFixed(2)
    }

    const initialEquity = initialData?.balance || 0

    const equityPresets = [
        { label: "$1,000 (1K)", value: "1000" },
        { label: "$5,000 (5K)", value: "5000" },
        { label: "$10,000 (10K)", value: "10000" },
        { label: "$25,000 (25K)", value: "25000" },
        { label: "$50,000 (50K)", value: "50000" },
        { label: "$100,000 (100K)", value: "100000" },
        { label: "$200,000 (200K)", value: "200000" },
        { label: "$500,000 (500K)", value: "500000" },
        { label: "$1,000,000 (1000K)", value: "1000000" },
    ]

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<PackageFormValues>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            account_id: initialData?.account_id || "",
            platform: initialData?.credential?.platform || "",
            platform_id: initialData?.credential?.platform_id || "",
            server: initialData?.credential?.server || "",
            username: initialData?.credential?.username || "",
            password: "",
            name: initialData?.name || "",
            equity: initialData?.balance?.toString() || (initialData ? "" : "1000000"),
            phase: initialData?.phase?.toLowerCase() || "phase 1",
            instrument: initialData?.symbol || (initialData ? "" : "XAUUSD"),
            purchase_price: initialData?.purchase_price?.toString() || "",
            funder_id: initialData?.funder_id?.toString() || "",
            max_daily_loss_percent:
                initialData?.max_daily_loss_percent?.toString() ||
                getDefaultPercentageValue(initialData?.max_daily_loss, initialEquity),
            max_total_loss_percent:
                initialData?.max_total_loss_percent?.toString() ||
                getDefaultPercentageValue(initialData?.max_total_loss, initialEquity),
            profit_target_percent:
                initialData?.profit_target_percent?.toString() ||
                getDefaultPercentageValue(initialData?.profit_target, initialEquity),
            daily_profit_target_percent:
                initialData?.daily_profit_target_percent?.toString() ||
                getDefaultPercentageValue(initialData?.daily_profit_target, initialEquity),
            consistency_rule_percent:
                initialData?.consistency_rule?.toString() || "40",
        },
    })

    const equity = watch("equity")
    const dailyLossPercent = watch("max_daily_loss_percent") || "0"
    const totalLossPercent = watch("max_total_loss_percent") || "0"
    const profitTargetPercent = watch("profit_target_percent") || "0"
    const dailyProfitTargetPercent = watch("daily_profit_target_percent") || "0"
    const platform = watch("platform")

    // Live preview: convert percentages to dollar values based on current equity.
    React.useEffect(() => {
        const equityValue = parseFloat(equity) || 0

        setCalculatedValues({
            max_daily_loss: (equityValue * (parseFloat(dailyLossPercent) || 0)) / 100,
            max_total_loss: (equityValue * (parseFloat(totalLossPercent) || 0)) / 100,
            profit_target: (equityValue * (parseFloat(profitTargetPercent) || 0)) / 100,
            daily_profit_target: (equityValue * (parseFloat(dailyProfitTargetPercent) || 0)) / 100,
        })
    }, [equity, dailyLossPercent, totalLossPercent, profitTargetPercent, dailyProfitTargetPercent])

    const onSubmit = async (data: PackageFormValues) => {
        setIsPending(true)
        try {
            const equityValue = parseFloat(data.equity)
            const submitDailyLossPercent = data.max_daily_loss_percent ? parseFloat(data.max_daily_loss_percent) : 0
            const submitTotalLossPercent = data.max_total_loss_percent ? parseFloat(data.max_total_loss_percent) : 0
            const submitProfitTargetPercent = data.profit_target_percent ? parseFloat(data.profit_target_percent) : 0
            const submitDailyProfitTargetPercent = data.daily_profit_target_percent ? parseFloat(data.daily_profit_target_percent) : 0
            const submitConsistencyRulePercent = data.consistency_rule_percent ? parseFloat(data.consistency_rule_percent) : 40

            const payload = {
                name: data.name,
                balance: equityValue,
                purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
                phase: data.phase,
                symbol: data.instrument,
                funder_id: data.funder_id,
                account_id: data.account_id,
                credential_id: null as any,
                max_daily_loss: submitDailyLossPercent > 0 ? (equityValue * submitDailyLossPercent) / 100 : null,
                max_total_loss: submitTotalLossPercent > 0 ? (equityValue * submitTotalLossPercent) / 100 : null,
                profit_target: submitProfitTargetPercent > 0 ? (equityValue * submitProfitTargetPercent) / 100 : null,
                daily_profit_target: submitDailyProfitTargetPercent > 0 ? (equityValue * submitDailyProfitTargetPercent) / 100 : null,
                consistency_rule: submitConsistencyRulePercent,
            }

            const credPayload: any = {
                username: data.username,
                platform: data.platform,
                platform_id: data.platform_id,
                server: data.server,
                account_id: data.account_id,
            }
            if (data.password) {
                credPayload.password = data.password;
            }

            if (isUpdate) {
                if (initialData.credential_id) {
                    await updateCredential(initialData.credential_id, credPayload);
                    payload.credential_id = initialData.credential_id;
                } else {
                    const credRes: any = await createCredential(credPayload);
                    payload.credential_id = credRes?.data?.[0]?.id || credRes?.[0]?.id || credRes?.id;
                }
                await updatePackage(initialData.id, payload)
                toast.success("Package updated successfully")
            } else {
                if (!data.password) throw new Error("Password is required for new packages");
                const credRes: any = await createCredential(credPayload);
                const newCredId = credRes?.data?.[0]?.id || credRes?.[0]?.id || credRes?.id;
                if (!newCredId) throw new Error("Failed to create credential");
                
                payload.credential_id = newCredId;
                const newPkgRes: any = await createPackage(payload)
                const newPkgId = newPkgRes?.[0]?.id || newPkgRes?.id || newPkgRes?.data?.[0]?.id;

                if (newPkgId && newCredId) {
                    await createFunderAccount({
                        package_id: newPkgId,
                        credential_id: newCredId,
                        status: "idle"
                    });
                }
                toast.success("Package created successfully")
            }

            if (onSuccess) {
                onSuccess()
            } else {
                router.push("/dashboard/funders/packages")
            }
            router.refresh()
        } catch (error: any) {
            console.error("Operation failed:", error)
            Swal.fire({
                title: 'Error!',
                text: error.message || "Something went wrong",
                icon: 'error',
                confirmButtonColor: '#2563eb',
                background: '#0a0a0a',
                color: '#ffffff'
            })
        } finally {
            setIsPending(false)
        }
    }

    const onError = (errors: any) => {
        const detailsFields = ['funder_id', 'account_id', 'name', 'equity', 'purchase_price', 'phase', 'instrument'];
        const credentialFields = ['platform', 'platform_id', 'server', 'username', 'password'];
        
        let tabToSwitch = "details";
        
        if (detailsFields.some(field => errors[field])) {
            tabToSwitch = "details";
        } else if (credentialFields.some(field => errors[field])) {
            tabToSwitch = "credentials";
        } else {
            tabToSwitch = "rules";
        }

        setActiveTab(tabToSwitch);
        
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField && errors[firstErrorField]?.message) {
            toast.error(errors[firstErrorField].message as string);
        } else {
            toast.error(`Please fill in all required fields in the ${tabToSwitch} tab.`);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 p-1 rounded-md">
                    <TabsTrigger value="details" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">Details</TabsTrigger>
                    <TabsTrigger value="credentials" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">Credentials</TabsTrigger>
                    <TabsTrigger value="rules" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">Rules</TabsTrigger>
                </TabsList>

                <div className="h-[420px] md:h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                    <TabsContent value="details" className="space-y-6 mt-6">
            {/* Funder Selection */}
            <div className="space-y-2">
                <Label htmlFor="funder_id" className="text-white">
                    Select Funder <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                    <select
                        id="funder_id"
                        {...register("funder_id")}
                        className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 text-white px-3 py-1 text-sm appearance-none focus:border-blue-500 transition-colors"
                    >
                        <option value="">-- Select Funder --</option>
                        {funders.map((funder) => (
                            <option key={funder.id} value={funder.id}>
                                {funder.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.funder_id && <p className="text-xs text-red-500">{errors.funder_id.message}</p>}
            </div>

            {/* User Selection */}
            <div className="space-y-2">
                <Label htmlFor="account_id" className="text-white">
                    Select User <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                    <select
                        id="account_id"
                        {...register("account_id")}
                        className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 text-white px-3 py-1 text-sm appearance-none focus:border-blue-500 transition-colors"
                    >
                        <option value="">-- Select User --</option>
                        {accounts.map((acc: any) => (
                            <option key={acc.id} value={acc.id}>
                                {acc.first_name} {acc.last_name} ({acc.email})
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.account_id && <p className="text-xs text-red-500">{errors.account_id.message}</p>}
            </div>

            {/* Package Name */}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                    Package Name <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="name"
                    {...register("name")}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    placeholder="e.g. 100K Evaluation"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Grid for Balance, Purchase Price, Phase, Symbol */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Equity */}
                <div className="space-y-2">
                    <Label htmlFor="equity" className="text-white">
                        Equity ($) <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="equity"
                            type="number"
                            step="0.01"
                            {...register("equity")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 pr-12"
                            placeholder="e.g. 100000"
                        />
                        <div className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center border-l border-gray-700 bg-gray-900/50 hover:bg-gray-900 rounded-r-md cursor-pointer overflow-hidden">
                            <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setValue("equity", e.target.value, { shouldValidate: true })
                                    }
                                    e.target.value = "" // reset select
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                defaultValue=""
                            >
                                <option value="" disabled>-- Select Preset --</option>
                                {equityPresets.map((preset) => (
                                    <option key={preset.value} value={preset.value}>
                                        {preset.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {errors.equity && <p className="text-xs text-red-500">{errors.equity.message}</p>}
                </div>

                {/* Purchase Price */}
                <div className="space-y-2">
                    <Label htmlFor="purchase_price" className="text-white">
                        Purchase Price ($)
                    </Label>
                    <Input
                        id="purchase_price"
                        type="number"
                        step="0.01"
                        {...register("purchase_price")}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        placeholder="e.g. 500"
                    />
                    {errors.purchase_price && <p className="text-xs text-red-500">{errors.purchase_price.message}</p>}
                </div>

                {/* Phase */}
                <div className="space-y-2">
                    <Label htmlFor="phase" className="text-white">
                        Phase <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                        <select
                            id="phase"
                            {...register("phase")}
                            className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 text-white px-3 py-1 text-sm appearance-none focus:border-blue-500 transition-colors"
                        >
                            <option value="">-- select phase --</option>
                            <option value="live">live</option>
                            <option value="phase 1">phase 1</option>
                            <option value="phase 2">phase 2</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.phase && <p className="text-xs text-red-500">{errors.phase.message}</p>}
                </div>

                {/* instrument */}
                <div className="space-y-2">
                    <Label htmlFor="instrument" className="text-white">
                        Instrument <span className="text-red-400">*</span>
                    </Label>
                    <Input
                        id="instrument"
                        {...register("instrument")}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        placeholder="e.g. MT5"
                    />
                    {errors.instrument && <p className="text-xs text-red-500">{errors.instrument.message}</p>}
                </div>
            </div>

                            </TabsContent>

                <TabsContent value="credentials" className="space-y-6 mt-6">
                    {/* Credential Fields */}
            <div className="space-y-4 pt-4 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-400">Account Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PLATFORM */}
                    <div className="space-y-2">
                        <Label htmlFor="platform" className="text-white">Platform <span className="text-red-400">*</span></Label>
                        <div className="relative">
                            <select
                                id="platform"
                                {...register("platform")}
                                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 text-white px-3 py-1 text-sm appearance-none focus:border-blue-500 transition-colors"
                            >
                                <option value="">Select platform</option>
                                <option value="cTrader">cTrader</option>
                                <option value="Trade Locker">Trade Locker</option>
                                <option value="Tradeverse">Tradeverse</option>
                                <option value="MT5">MT5</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.platform && <p className="text-xs text-red-500">{errors.platform.message}</p>}
                    </div>

                    {/* PLATFORM ID */}
                    <div className="space-y-2">
                        <Label htmlFor="platform_id" className="text-white">Platform ID <span className="text-red-400">*</span></Label>
                        <Input
                            id="platform_id"
                            {...register("platform_id")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            placeholder="Enter ID"
                        />
                        {errors.platform_id && <p className="text-xs text-red-500">{errors.platform_id.message}</p>}
                    </div>

                    {/* SERVER */}
                    {(platform?.toLowerCase().includes("trade locker") || platform?.toLowerCase().includes("mt5")) && (
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <Label htmlFor="server" className="text-white">
                                {platform?.toLowerCase().includes("mt5") ? "MT5 Server URL" : "Server"}
                            </Label>
                            <Input
                                id="server"
                                {...register("server")}
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                                placeholder={platform?.toLowerCase().includes("mt5") ? "https://web.metatrader.app/terminal" : "e.g. HEROFX"}
                            />
                        </div>
                    )}

                    {/* USERNAME */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-white">Username <span className="text-red-400">*</span></Label>
                        <Input
                            id="username"
                            {...register("username")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            placeholder="Enter platform username"
                        />
                        {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
                    </div>

                    {/* PASSWORD */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-white">
                            Password {!isUpdate && <span className="text-red-400">*</span>}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                {...register("password")}
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 pr-10"
                                placeholder={isUpdate ? "Leave blank to keep unchanged" : "Enter password"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>
                </div>
            </div>
                </TabsContent>

                <TabsContent value="rules" className="space-y-6 mt-6">
                    {/* Risk metrics are entered as percentages and previewed in dollars. */}
            <div className="space-y-4 pt-4 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-400">Risk & Profit Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-6 gap-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="max_daily_loss_percent" className="text-white text-xs">
                            Max Daily Loss (%)
                        </Label>
                        <Input
                            id="max_daily_loss_percent"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...register("max_daily_loss_percent")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            placeholder="e.g. 5"
                        />
                        <p className="text-xs text-gray-400">
                            = ${calculatedValues.max_daily_loss.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="max_total_loss_percent" className="text-white text-xs">
                            Max Total Loss (%)
                        </Label>
                        <Input
                            id="max_total_loss_percent"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...register("max_total_loss_percent")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            placeholder="e.g. 10"
                        />
                        <p className="text-xs text-gray-400">
                            = ${calculatedValues.max_total_loss.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="daily_profit_target_percent" className="text-white text-xs">
                            Daily Profit TGT (%)
                        </Label>
                        <Input
                            id="daily_profit_target_percent"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...register("daily_profit_target_percent")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            placeholder="e.g. 5"
                        />
                        <p className="text-xs text-gray-400">
                            = ${calculatedValues.daily_profit_target.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="profit_target_percent" className="text-white text-xs">
                            Max Profit TGT (%)
                        </Label>
                        <Input
                            id="profit_target_percent"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...register("profit_target_percent")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            placeholder="e.g. 10"
                        />
                        <p className="text-xs text-gray-400">
                            = ${calculatedValues.profit_target.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="consistency_rule_percent" className="text-white text-xs">
                            Consistency Rule (%)
                        </Label>
                        <Input
                            id="consistency_rule_percent"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...register("consistency_rule_percent")}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            placeholder="e.g. 40"
                        />
                        <p className="text-xs text-gray-400">
                            Max 1-day profit as % of total
                        </p>
                    </div>
                </div>
            </div>
                </TabsContent>
                </div>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onCancel ? onCancel() : router.back()}
                    className="text-white hover:bg-gray-800 px-6"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isUpdate ? "Update Package" : "Add Package"}
                </Button>
            </div>
        </form>
    )
}
