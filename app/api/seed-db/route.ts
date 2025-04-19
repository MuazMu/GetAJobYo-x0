import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Add sample jobs
    const sampleJobs = [
      {
        title: "Frontend Developer",
        company: "TechCorp",
        location: "San Francisco, CA",
        description:
          "We're looking for a skilled Frontend Developer to join our team. You'll be responsible for building user interfaces and implementing designs.",
        salary_range: "$80,000 - $120,000",
        job_type: "Full-time",
        requirements: ["React", "JavaScript", "CSS", "HTML", "3+ years experience"],
      },
      {
        title: "Backend Engineer",
        company: "DataSystems",
        location: "New York, NY",
        description: "Join our backend team to build scalable APIs and services that power our platform.",
        salary_range: "$90,000 - $130,000",
        job_type: "Full-time",
        requirements: ["Node.js", "Python", "SQL", "NoSQL", "5+ years experience"],
      },
      {
        title: "UX Designer",
        company: "CreativeMinds",
        location: "Remote",
        description: "Design beautiful and intuitive user experiences for our products.",
        salary_range: "$70,000 - $110,000",
        job_type: "Contract",
        requirements: ["Figma", "Adobe XD", "User Research", "Prototyping", "2+ years experience"],
      },
      {
        title: "DevOps Engineer",
        company: "CloudTech",
        location: "Seattle, WA",
        description: "Help us build and maintain our cloud infrastructure and deployment pipelines.",
        salary_range: "$100,000 - $140,000",
        job_type: "Full-time",
        requirements: ["AWS", "Docker", "Kubernetes", "CI/CD", "4+ years experience"],
      },
      {
        title: "Mobile Developer",
        company: "AppWorks",
        location: "Austin, TX",
        description: "Develop mobile applications for iOS and Android platforms.",
        salary_range: "$85,000 - $125,000",
        job_type: "Full-time",
        requirements: ["React Native", "Swift", "Kotlin", "Mobile UI/UX", "3+ years experience"],
      },
    ]

    // Insert sample jobs
    const { data: jobsData, error: jobsError } = await supabase
      .from("jobs")
      .upsert(sampleJobs, { onConflict: "title,company" })
      .select()

    if (jobsError) {
      console.error("Error seeding jobs:", jobsError)
      return NextResponse.json({ success: false, error: jobsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        jobsAdded: jobsData?.length || 0,
      },
    })
  } catch (error) {
    console.error("Unexpected error seeding database:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
