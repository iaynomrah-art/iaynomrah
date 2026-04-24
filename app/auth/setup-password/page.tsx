"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SetupPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Debug logging for URL and hash
        if (process.env.NODE_ENV === 'development' || true) {
            console.log("Current URL:", window.location.href);
            console.log("Current Hash:", window.location.hash);
        }

        // Check for error parameters in the hash fragment (Supabase redirects errors there)
        const hash = window.location.hash;
        if (hash.includes("error=")) {
            const params = new URLSearchParams(hash.substring(1));
            const errorDescription = params.get("error_description") || params.get("error") || "Invalid or expired link";
            toast.error(errorDescription.replace(/\+/g, " "));
            setIsCheckingSession(false);
            return;
        }

        // Use getSession but also listen for state changes to catch the hash fragment processing
        async function checkSession() {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (session) {
                setIsCheckingSession(false);
            } else if (error) {
                console.error("Session check error:", error);
                toast.error("Session verification failed. Please try again.");
                setIsCheckingSession(false);
            } else {
                // If no session yet, listen for the first auth event
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (session) {
                        setIsCheckingSession(false);
                        subscription.unsubscribe();
                    } else if (event === 'SIGNED_OUT') {
                        // If it's been a while and still no session, show error
                        setTimeout(() => {
                            if (isCheckingSession) {
                                toast.error("No active session found. Your link might be expired.");
                                setIsCheckingSession(false);
                            }
                        }, 3000);
                    }
                });

                return () => subscription.unsubscribe();
            }
        }
        checkSession();
    }, [supabase.auth, isCheckingSession]);

    const handleSetupPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setIsSuccess(true);
            toast.success("Password set successfully!");
            
            // Redirect after a short delay to show success state
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (error: any) {
            console.error("Error setting password:", error);
            toast.error(error.message || "Failed to set password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingSession) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                    <p className="text-gray-400 animate-pulse">Verifying invitation session...</p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-lg shadow-green-500/5">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white">Welcome Aboard!</h1>
                        <p className="text-gray-400">Your account is now ready. Redirecting you to the dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
            
            <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="bg-[#0a0a0a]/80 border-gray-800 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1 pb-8">
                        <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-4">
                            <ShieldCheck className="h-6 w-6 text-blue-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white tracking-tight">Finalize Your Account</CardTitle>
                        <CardDescription className="text-gray-400">
                            Set a secure password for your new account to get started.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSetupPassword} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password text-gray-300 font-medium">New Password</Label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-[#111111] border-gray-800 text-white pl-10 pr-10 focus:ring-blue-600/20 focus:border-blue-600 h-11 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-500 pl-1">Min. 6 characters with letters and numbers</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password text-gray-300 font-medium">Confirm Password</Label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <Input
                                            id="confirm-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="bg-[#111111] border-gray-800 text-white pl-10 h-11 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    "Complete Setup"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
