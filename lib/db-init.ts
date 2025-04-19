import { createServerClient } from "./supabase"

// This function ensures all required tables exist
export async function initializeDatabase() {
  const supabase = createServerClient()

  console.log("Checking database tables...")

  // Check if users table exists
  const { data: usersTable, error: usersError } = await supabase.from("users").select("id").limit(1)

  if (usersError) {
    console.error("Error checking users table:", usersError)

    // Create users table if it doesn't exist
    const { error: createUsersError } = await supabase.rpc("create_users_table")

    if (createUsersError) {
      console.error("Error creating users table:", createUsersError)
    } else {
      console.log("Users table created successfully")
    }
  } else {
    console.log("Users table exists")
  }

  // Check if profiles table exists
  const { data: profilesTable, error: profilesError } = await supabase.from("profiles").select("id").limit(1)

  if (profilesError) {
    console.error("Error checking profiles table:", profilesError)

    // Create profiles table if it doesn't exist
    const { error: createProfilesError } = await supabase.rpc("create_profiles_table")

    if (createProfilesError) {
      console.error("Error creating profiles table:", createProfilesError)
    } else {
      console.log("Profiles table created successfully")
    }
  } else {
    console.log("Profiles table exists")
  }

  return {
    usersTableExists: !usersError,
    profilesTableExists: !profilesError,
  }
}
