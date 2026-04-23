"use server";

import { createClient } from "@/lib/supabase/server";
import { SignJWT } from "jose";

export async function inviteUserAction(email: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return { error: "Unauthorized" };
        }

        // Check if user is super-admin
        const role = user.app_metadata?.role;
        if (role !== 'super-admin') {
            return { error: "Forbidden: Only super-admins can invite users" };
        }

        const secretKey = process.env.NEXT_SECRET_KEY;
        if (!secretKey) {
            console.error("NEXT_SECRET_KEY is not defined");
            return { error: "Internal server error" };
        }

        const secret = new TextEncoder().encode(secretKey);
        const algorithm = process.env.NEXT_ALGORITHM || "HS256";
        const expireMinutes = parseInt(process.env.NEXT_ACCESS_TOKEN_EXPIRE_MINUTES || "30", 10);

        // Generate JWT
        const token = await new SignJWT({
            sub: user.id,
            email: user.email,
            iat: Math.floor(Date.now() / 1000),
        })
            .setProtectedHeader({ alg: algorithm })
            .setIssuedAt()
            .setExpirationTime(`${expireMinutes}m`)
            .sign(secret);

        // Send request to n8n
        const response = await fetch("https://n8n.heysnaply.com/webhook/abfadb79-0bd0-4232-bb7d-e92828fe0c2d", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.error || "Failed to send invitation to service";
            console.error("n8n error:", errorData);
            return { error: errorMessage };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error("Invite user action error:", error);
        return { error: "An unexpected error occurred" };
    }
}
