import { SupabaseClient } from '@supabase/supabase-js'

export async function ensureUserExists(supabase: SupabaseClient, userId: string, email: string) {
  // Check if user exists
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  // If user exists, return
  if (existingUser) {
    return true
  }
  
  // If error is not "no rows", log it
  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error checking user existence:', selectError)
  }

  // Create user if they don't exist
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email,
      display_name: null,
      avatar_url: null,
      preferences: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (insertError) {
    console.error('Error creating user:', insertError)
    console.error('User ID:', userId)
    console.error('Email:', email)
    
    // Check if it's a unique constraint violation (user already exists)
    if (insertError.code === '23505') {
      // User already exists, this is okay
      return true
    }
    
    throw new Error(`Failed to create user record: ${insertError.message}`)
  }

  return true
}