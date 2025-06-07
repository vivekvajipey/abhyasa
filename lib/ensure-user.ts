import { SupabaseClient } from '@supabase/supabase-js'

export async function ensureUserExists(supabase: SupabaseClient, userId: string, email: string) {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (!existingUser) {
    // Create user if they don't exist
    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email
      })

    if (error) {
      console.error('Error creating user:', error)
      throw new Error('Failed to create user record')
    }
  }

  return true
}