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



