"use server";

import { createClient } from "@/lib/supabase/server";

export async function getUnits() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("*, franchise(*), accounts(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching units:", error);
    return [];
  }

  return data;
}

export async function getUnitsWithCounts() {
  const supabase = await createClient();
  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("*, franchise(*)")
    .order("created_at", { ascending: false });

  if (unitsError) {
    console.error("Error fetching units:", unitsError);
    return [];
  }

  const { data: accountsWithFunders, error: accountsError } = await supabase
    .from("accounts")
    .select(
      `
            unit_id, 
            packages:package(
                funder_accounts:funder_account(
                    status
                ),
                funders:funder_id(
                    allias,
                    allias_color,
                    text_color
                )
            )
        `,
    )
    .not("unit_id", "is", null);

  if (accountsError) {
    console.error("Error fetching accounts for counts:", accountsError);
    return units.map((unit) => ({ ...unit, funder_counts: [] }));
  }

  return units.map((unit) => {
    const relatedAccounts = accountsWithFunders.filter(
      (acc) => acc.unit_id === unit.id,
    );

    // Group by funder alias from all linked funder accounts
    const funderMap: Record<
      string,
      { count: number; allias_color: string; text_color: string }
    > = {};

    relatedAccounts.forEach((acc) => {
      (acc.packages || []).forEach((pkg: any) => {
        (pkg.funder_accounts || []).forEach((fa: any) => {
          // Only count "active" status funder accounts if desired,
          // but usually the count is for total accounts assigned to this unit
          if (
            fa.status === "idle" ||
            fa.status === "trading" ||
            fa.status === "paired"
          ) {
            const funder = pkg.funders;
            if (funder && funder.allias) {
              if (!funderMap[funder.allias]) {
                funderMap[funder.allias] = {
                  count: 0,
                  allias_color: funder.allias_color || "#1c64f2",
                  text_color: funder.text_color || "white",
                };
              }
              funderMap[funder.allias].count++;
            }
          }
        });
      });
    });

    const funder_counts = Object.entries(funderMap).map(([allias, data]) => ({
      allias,
      count: data.count,
      allias_color: data.allias_color,
      text_color: data.text_color,
    }));

    return {
      ...unit,
      funder_counts,
    };
  });
}

export async function getUnitById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("*, franchise(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching unit:", error);
    return null;
  }
  return data;
}

export async function createUnit(formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateUnit(id: string, formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deleteUnit(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("units").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  return true;
}

export async function updateUnitStatus(id: string, status: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function archiveUnit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .update({ archived: true })
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function unarchiveUnit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .update({ archived: false })
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function checkUnitHealth(apiBaseUrl: string) {
  if (!apiBaseUrl) return false;

  let normalizedUrl = apiBaseUrl;
  if (
    !normalizedUrl.startsWith("http://") &&
    !normalizedUrl.startsWith("https://")
  ) {
    normalizedUrl = `http://${normalizedUrl}`;
  }

  try {
    const baseUrl = normalizedUrl.endsWith("/")
      ? normalizedUrl.slice(0, -1)
      : normalizedUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for health check

    const response = await fetch(`${baseUrl}/api/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.status === 200;
  } catch (error) {
    console.error(`Health check failed for ${apiBaseUrl}:`, error);
    return false;
  }
}

export async function updateUnitConfig(apiBaseUrl: string, unitName: string) {
  if (!apiBaseUrl) {
    throw new Error("API Base URL is required");
  }

  let normalizedUrl = apiBaseUrl;
  if (
    !normalizedUrl.startsWith("http://") &&
    !normalizedUrl.startsWith("https://")
  ) {
    normalizedUrl = `http://${normalizedUrl}`;
  }

  try {
    const baseUrl = normalizedUrl.endsWith("/")
      ? normalizedUrl.slice(0, -1)
      : normalizedUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${baseUrl}/api/v1/config/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ server_name: unitName }),
      next: { revalidate: 0 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Config update failed for ${apiBaseUrl}:`, error);
    if (error.name === "AbortError") {
      throw new Error(
        "Connection timed out. The unit server might be offline.",
      );
    }
    if (error.message === "fetch failed") {
      throw new Error(
        "Connection failed. Please ensure the API URL is correct and the server is reachable.",
      );
    }
    throw error;
  }
}
