import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Create user with admin API to bypass email confirmation
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This bypasses email confirmation
      user_metadata: {
        full_name: fullName,
      },
    })

    if (error) {
      console.error("Error creating user:", error)

      // Check if user already exists
      if (error.message.includes("already exists")) {
        // Try to get the user by email
        const { data: userData } = await supabase.auth.admin.listUsers({
          filters: {
            email: email,
          },
        })

        if (userData && userData.users && userData.users.length > 0) {
          const userId = userData.users[0].id

          // Use admin API to update user and confirm email
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { email_confirm: true })

          if (updateError) {
            console.error("Error confirming existing user email:", updateError)
          } else {
            console.log("Confirmed email for existing user:", userId)
            return NextResponse.json({
              success: true,
              message: "User already exists, email confirmed",
              user: userData.users[0],
            })
          }
        }
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create user record
    if (data.user) {
      const { error: userError } = await supabase.from("users").insert([
        {
          id: data.user.id,
          email: email,
          full_name: fullName,
        },
      ])

      if (userError) {
        console.error("Error creating user record:", userError)
      }

      // Create profile record
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          skills: [],
          preferred_job_types: [],
          preferred_locations: [],
        },
      ])

      if (profileError) {
        console.error("Error creating profile:", profileError)
      }
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
