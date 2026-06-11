// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import { UserProfile, CreateUserInput, SYSTEM_TAG } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseClient = createClient(supabaseUrl, supabaseKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function createUserProfile(input: CreateUserInput): Promise<UserProfile> {
  const { email, planId, mintbirdCustomerId } = input;
  const tempPassword = `temp_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  
  if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
  
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      email,
      system_tag: SYSTEM_TAG,
      plan_id: planId,
      mintbird_customer_id: mintbirdCustomerId,
      subscription_status: 'active',
    })
    .select()
    .single();
  
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }
  
  return profile as UserProfile;
}

export async function getUsersBySystemTag(
  tag: string = SYSTEM_TAG,
  filters?: { plan?: string; status?: string }
): Promise<UserProfile[]> {
  let query = supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('system_tag', tag)
    .order('created_at', { ascending: false });
  
  if (filters?.plan) query = query.eq('plan_id', filters.plan);
  if (filters?.status) query = query.eq('subscription_status', filters.status);
  
  const { data, error } = await query;
  if (error) throw new Error(`Query failed: ${error.message}`);
  return (data || []) as UserProfile[];
}
