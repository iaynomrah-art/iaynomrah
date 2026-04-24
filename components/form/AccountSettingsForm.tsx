"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    User, 
    Lock, 
    Mail, 
    Phone,
    Loader2, 
    ShieldCheck, 
    Save,
    ArrowLeft,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface AccountSettingsFormProps {
    initialData: {
        email: string;
        full_name: string;
        phone: string;
    };
}

export default function AccountSettingsForm({ initialData }: AccountSettingsFormProps) {
    const router = useRouter();
    const supabase = createClient();

    const [isSaving, setIsSaving] = useState(false);
    const [userData, setUserData] = useState(initialData);
    
    // Password states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: userData.full_name,
                    phone: userData.phone, // Store phone in metadata to avoid confirmation requirement
                }
            });

            if (error) throw error;
            toast.success("Profile updated successfully");
            router.refresh(); // Refresh SSR data
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsSaving(true);

        try {
            // 1. Re-authenticate with old password first (Best practice)
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword,
                });

                if (signInError) {
                    throw new Error("Incorrect current password. Verification failed.");
                }
            }

            // 2. Update to new password
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;
            
            toast.success("Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Error updating password:", error);
            toast.error(error.message || "Failed to update password");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Button 
                        variant="ghost" 
                        className="text-gray-400 hover:text-white -ml-2 mb-2"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-gray-400">Manage your profile and security (Server-side rendered).</p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-[#111111] border border-gray-800 p-1">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="bg-[#0a0a0a] border-gray-800 text-white shadow-xl">
                        <CardHeader>
                            <CardTitle>Personal Info</CardTitle>
                            <CardDescription className="text-gray-400">Update your name and contact number.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-400 font-medium">Full Name</Label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                            <Input 
                                                value={userData.full_name} 
                                                onChange={(e) => setUserData({...userData, full_name: e.target.value})}
                                                placeholder="Enter your full name"
                                                className="bg-[#111111] border-gray-800 focus:border-blue-600 pl-10 h-12"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-400 font-medium">Phone Number (Optional)</Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                            <Input 
                                                value={userData.phone} 
                                                onChange={(e) => setUserData({...userData, phone: e.target.value})}
                                                placeholder="+1 (555) 000-0000"
                                                className="bg-[#111111] border-gray-800 focus:border-blue-600 pl-10 h-12"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-400 font-medium">Email Address (Read-only)</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                                            <Input 
                                                value={userData.email} 
                                                disabled
                                                className="bg-[#050505] border-gray-900 text-gray-600 cursor-not-allowed pl-10 h-12"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button 
                                        type="submit" 
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-11"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="bg-[#0a0a0a] border-gray-800 text-white shadow-xl">
                        <CardHeader>
                            <CardTitle>Security & Password</CardTitle>
                            <CardDescription className="text-gray-400">Keep your account secure by updating your password.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-400 font-medium">Current Password</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                            <Input 
                                                type="password"
                                                placeholder="••••••••"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="bg-[#111111] border-gray-800 focus:border-blue-600 pl-10 h-12"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-400 font-medium">New Password</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                            <Input 
                                                type="password"
                                                placeholder="••••••••"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="bg-[#111111] border-gray-800 focus:border-blue-600 pl-10 h-12"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-400 font-medium">Confirm New Password</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                            <Input 
                                                type="password"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="bg-[#111111] border-gray-800 focus:border-blue-600 pl-10 h-12"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-start pt-4">
                                    <Button 
                                        type="submit" 
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-11"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
