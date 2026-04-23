"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { inviteUserAction } from "@/lib/invite-actions";

export const InviteUserButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setInviteLink(null);

        try {
            const result = await inviteUserAction(email);

            if (result.error) {
                throw new Error(result.error);
            }

            const data = result.data;
            
            // Handle both array and single object response
            const actionLink = Array.isArray(data) ? data[0]?.action_link : data?.action_link;
            
            if (actionLink) {
                setInviteLink(actionLink);
                toast.success("Invitation link generated!");
            } else {
                toast.success("Invitation sent successfully!");
                setIsOpen(false);
                setEmail("");
            }
        } catch (error: any) {
            console.error("Error inviting user:", error);
            toast.error(error.message || "Failed to send invitation. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!inviteLink) return;
        try {
            await navigator.clipboard.writeText(inviteLink);
            setIsCopied(true);
            toast.success("Copied to clipboard!");
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 gap-2 shadow-lg shadow-blue-900/10 transition-all active:scale-95"
            >
                <UserPlus className="h-4 w-4" />
                <span>Invite User</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    setInviteLink(null);
                    setEmail("");
                }
            }}>
                <DialogContent className="bg-[#0a0a0a] border-gray-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-blue-500" />
                            Invite New User
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Enter the email address of the user you'd like to invite to the platform.
                        </DialogDescription>
                    </DialogHeader>

                    {!inviteLink ? (
                        <form onSubmit={handleInvite} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-[#111111] border-gray-800 text-white focus:border-blue-600 focus:ring-blue-600/20"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white hover:bg-white/5"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 hover:bg-blue-500 text-white min-w-[100px]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Invite"
                                    )}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 mt-4">
                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                                Invitation successful! You can copy the link below and send it to the user manually if they don't receive the email.
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-300">Invitation Link</Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={inviteLink}
                                        className="bg-[#111111] border-gray-800 text-white focus:ring-0"
                                    />
                                    <Button
                                        onClick={copyToClipboard}
                                        variant="outline"
                                        className="bg-[#111111] border-gray-800 hover:bg-[#1a1a1a] text-white shrink-0"
                                    >
                                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={() => setIsOpen(false)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
