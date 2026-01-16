import { createClient } from "@/lib/supabase/server";

export async function getCredentials() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select("*, funders(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching credentials:", error);
    return [];
  }
  return data;
}

export async function getCredentialById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select("*, funders(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching credential:", error);
    return null;
  }
  return data;
}

export async function createCredential(formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateCredential(id: number, formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deleteCredential(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("credentials")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  return true;
}


export async function credentialsTable() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select(`
      id,
      password,
      account:accounts!user_id(first_name, last_name, email),
      funder:funders(name, allias, allias_color, text_color)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching credentials table data:", error);
    return [];
  }
  return data;
}
