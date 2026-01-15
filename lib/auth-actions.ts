"use server";

import { SignJWT, JWTPayload } from "jose";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function setAdditionalAuthCookie() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const secretKey = process.env.NEXT_SECRET_KEY;
  if (!secretKey) {
    console.error("NEXT_SECRET_KEY is not defined");
    return { error: "Internal server error" };
  }

  const secret = new TextEncoder().encode(secretKey);
  const algorithm = process.env.NEXT_ALGORITHM || "HS256";
  const expireMinutes = parseInt(process.env.NEXT_ACCESS_TOKEN_EXPIRE_MINUTES || "60", 10);

  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: algorithm })
    .setIssuedAt()
    .setExpirationTime(`${expireMinutes}m`)
    .sign(secret);

  const cookieStore = await cookies();
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + expireMinutes);

  cookieStore.set("access_token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NEXT_ENV === "production",
    expires: expires,
    sameSite: "none",
  });

  return { success: true };
}

export async function clearAdditionalAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  return { success: true };
}

export async function checkUnitStatus(apiBaseUrl: string) {
  try {
    const { default: axios } = await import("axios");
    
    // Ensure URL is valid and remove trailing slash
    const baseUrl = apiBaseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/api/v1/health/`;
    
    
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 seconds timeout
    });

    return { 
      success: true, 
      status: response.status, 
      data: response.data 
    };
  } catch (error: any) {
    console.error("Error checking unit status:", error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return { 
        success: false, 
        status: error.response.status, 
        message: `API responded with error: ${error.response.status} ${error.response.statusText}`,
        detail: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response was received
      return { 
        success: false, 
        message: "No response received from unit API. Please check the URL and ensure the unit is online." 
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return { 
        success: false, 
        message: error.message || "Failed to connect to unit API" 
      };
    }
  }
}

