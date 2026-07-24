import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url=import.meta.env.VITE_SUPABASE_URL?.trim();const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const isCloudConfigured=Boolean(url&&key);
if(import.meta.env.DEV&&Boolean(url)!==Boolean(key))console.warn("BabyNest Cloud Sync configuration is incomplete. Add both public Supabase variables.");
export const supabase:SupabaseClient|null=isCloudConfigured?createClient(url!,key!,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:"babynest-supabase-auth"},realtime:{params:{eventsPerSecond:10}}}):null;
export function requireSupabase(){if(!supabase)throw new Error("CLOUD_NOT_CONFIGURED");return supabase}
