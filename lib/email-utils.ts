import { createBrowserClient } from "./supabase"
import { formatCurrency, parseSalaryRange } from "./currency-utils"

export async function sendApplicationEmail(
  jobId: string,
  userId: string,
  coverLetter: string | null,
): Promise<boolean> {
  try {
    const supabase = createBrowserClient()

    // Get job details
    const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", jobId).single()

    if (jobError) throw jobError

    // Get user details
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) throw userError

    // Get user profile
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError && profileError.code !== "PGRST116") throw profileError

    // Format salary information
    const { min: salaryMin, max: salaryMax } = parseSalaryRange(job.salary_range)
    const formattedSalary =
      salaryMin === salaryMax
        ? formatCurrency(salaryMin, job.currency || "USD")
        : `${formatCurrency(salaryMin, job.currency || "USD")} - ${formatCurrency(salaryMax, job.currency || "USD")}`

    const salaryPeriod = job.rate_period || "yearly"
    const formattedSalaryPeriod = salaryPeriod === "yearly" ? "per year" : `per ${salaryPeriod.slice(0, -2)}`

    // Prepare email content
    const emailContent = {
      to: job.creator_email,
      subject: `New Application: ${job.title} at ${job.company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">New Job Application</h2>
          
          <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #555;">Job Details</h3>
            <p><strong>Position:</strong> ${job.title}</p>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Salary:</strong> ${formattedSalary} ${formattedSalaryPeriod}</p>
            <p><strong>Job Type:</strong> ${job.job_type}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #555;">Applicant Information</h3>
            <p><strong>Name:</strong> ${user.full_name || "Not provided"}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Professional Title:</strong> ${profile?.title || "Not provided"}</p>
            <p><strong>Experience:</strong> ${profile?.experience_years || "Not provided"} years</p>
            <p><strong>Location:</strong> ${profile?.location || "Not provided"}</p>
            ${profile?.resume_url ? `<p><strong>Resume:</strong> <a href="${profile.resume_url}" style="color: #0070f3;">Download Resume</a></p>` : ""}
          </div>
          
          ${
            profile?.skills?.length
              ? `
          <div style="margin: 15px 0;">
            <h3 style="color: #555;">Skills</h3>
            <p>${profile.skills.join(", ")}</p>
          </div>
          `
              : ""
          }
          
          ${
            profile?.work_experience?.length
              ? `
          <div style="margin: 15px 0;">
            <h3 style="color: #555;">Work Experience</h3>
            ${profile.work_experience
              .map(
                (exp: any) => `
              <div style="margin-bottom: 10px;">
                <p style="margin: 0;"><strong>${exp.title}</strong> at ${exp.company}</p>
                <p style="margin: 0; color: #777; font-size: 0.9em;">
                  ${new Date(exp.startDate).toLocaleDateString()} - 
                  ${exp.current ? "Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ""}
                </p>
                <p style="margin: 5px 0 0 0;">${exp.description}</p>
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : ""
          }
          
          ${
            profile?.education
              ? `
          <div style="margin: 15px 0;">
            <h3 style="color: #555;">Education</h3>
            <p>${profile.education}</p>
          </div>
          `
              : ""
          }
          
          <div style="margin: 15px 0;">
            <h3 style="color: #555;">Online Profiles</h3>
            ${profile?.linkedin_url ? `<p><strong>LinkedIn:</strong> <a href="${profile.linkedin_url}" style="color: #0070f3;">${profile.linkedin_url}</a></p>` : ""}
            ${profile?.github_url ? `<p><strong>GitHub:</strong> <a href="${profile.github_url}" style="color: #0070f3;">${profile.github_url}</a></p>` : ""}
            ${profile?.portfolio_url ? `<p><strong>Portfolio:</strong> <a href="${profile.portfolio_url}" style="color: #0070f3;">${profile.portfolio_url}</a></p>` : ""}
          </div>
          
          <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #555;">Cover Letter</h3>
            <div style="white-space: pre-line;">${coverLetter || "No cover letter provided."}</div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eaeaea; font-size: 0.8em; color: #777; text-align: center;">
            <p>This application was sent via GetAJobYo. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    }

    // Send email using a server action
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailContent),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send email")
    }

    return true
  } catch (error) {
    console.error("Error sending application email:", error)
    return false
  }
}

// Add a new function to send application status update emails
export async function sendApplicationStatusEmail(
  applicationId: string,
  status: string,
  feedbackNote?: string,
): Promise<boolean> {
  try {
    const supabase = createBrowserClient()

    // Get application details with job and user info
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        user_id,
        job_id,
        cover_letter,
        user:users (id, email, full_name),
        job:jobs (id, title, company, location)
      `)
      .eq("id", applicationId)
      .single()

    if (appError) throw appError

    // Prepare email content
    const emailContent = {
      to: application.user.email,
      subject: `Application ${status === "accepted" ? "Accepted" : status === "rejected" ? "Rejected" : "Status Update"}: ${application.job.title} at ${application.job.company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: ${status === "accepted" ? "#16a34a" : status === "rejected" ? "#dc2626" : "#2563eb"}; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">
            Application ${status === "accepted" ? "Accepted" : status === "rejected" ? "Rejected" : "Status Update"}
          </h2>
          
          <p>Dear ${application.user.full_name || "Applicant"},</p>
          
          <p>Your application for <strong>${application.job.title}</strong> at <strong>${application.job.company}</strong> has been 
          ${status === "accepted" ? "accepted" : status === "rejected" ? "rejected" : `updated to "${status}"`}.</p>
          
          ${
            feedbackNote
              ? `
          <p><strong>Feedback:</strong></p>
          <p>${feedbackNote}</p>
          `
              : ""
          }
          
          ${
            status === "accepted"
              ? `
          <p>We will contact you shortly with next steps.</p>
          <p>Congratulations!</p>
          `
              : status === "rejected"
                ? `
          <p>We appreciate your interest and wish you the best in your job search.</p>
          `
                : status === "interviewing"
                  ? `
          <p>We would like to schedule an interview with you. Someone from our team will be in touch soon.</p>
          `
                  : `
          <p>Thank you for your application.</p>
          `
          }
          
          <p>Best regards,<br>The ${application.job.company} Team</p>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eaeaea; font-size: 0.8em; color: #777; text-align: center;">
            <p>This is an automated message from GetAJobYo. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    }

    // Send email using the API route
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailContent),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send email")
    }

    return true
  } catch (error) {
    console.error("Error sending application status email:", error)
    return false
  }
}
