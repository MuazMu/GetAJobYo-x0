import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Try to get the user by email
    const { data, error } = await supabase.auth.admin.listUsers({
      filters: {
        email: email,
      },
    })

    if (error) {
      console.error("Error finding user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || !data.users || data.users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = data.users[0].id

    // Use admin API to update user and confirm email
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { email_confirm: true })

    if (updateError) {
      console.error("Error confirming email:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Email confirmed successfully" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
