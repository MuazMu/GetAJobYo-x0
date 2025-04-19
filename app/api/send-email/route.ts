import { NextResponse } from "next/server"
import { SENDGRID_API_KEY } from "@/lib/env"

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!SENDGRID_API_KEY) {
      console.warn("SendGrid API key is not set. Email will be logged but not sent.")
      console.log("Email would be sent to:", to)
      console.log("Subject:", subject)
      console.log("HTML Content:", html)

      // Return success even though we didn't actually send the email
      return NextResponse.json({ success: true, message: "Email logged (SendGrid API key not set)" })
    }

    // Use SendGrid to send the email
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: "noreply@getajobyoapp.com", name: "GetAJobYo" },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("SendGrid API error:", errorData)
      return NextResponse.json({ error: "Failed to send email via SendGrid" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Email sent successfully via SendGrid" })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
