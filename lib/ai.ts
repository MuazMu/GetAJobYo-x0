import { createBrowserClient } from "./supabase"
import { OPENROUTER_API_KEY } from "./env"
import { sendApplicationEmail } from "./email-utils"

// Keep the URL constant
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

// Add a check for the API key
if (!OPENROUTER_API_KEY) {
  console.warn("OpenRouter API key is not set. AI features will not work properly.")
}

interface OpenRouterResponse {
  id: string
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function generateCoverLetter(jobTitle: string, company: string, jobDescription: string, userProfile: any) {
  try {
    const prompt = `
      Generate a professional cover letter for a ${jobTitle} position at ${company}.
      
      Job Description:
      ${jobDescription}
      
      Candidate Information:
      - Name: ${userProfile.full_name || "the candidate"}
      - Professional Title: ${userProfile.title || ""}
      - Experience: ${userProfile.experience_years || ""} years
      - Skills: ${userProfile.skills?.join(", ") || ""}
      - Education: ${userProfile.education || ""}
      - Bio: ${userProfile.bio || ""}
      
      The cover letter should be personalized, professional, and highlight how the candidate's skills and experience match the job requirements. Keep it concise (around 300-400 words) and include a proper greeting and closing.
    `

    console.log("Generating cover letter with OpenRouter API using Gemini model")

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://getajobyoapp.vercel.app",
        "X-Title": "GetAJobYo",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro-experimental",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}:`, await response.text())
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = (await response.json()) as OpenRouterResponse
    console.log("Cover letter generated successfully")
    return data.choices[0].message.content
  } catch (error) {
    console.error("Error generating cover letter:", error)
    throw error
  }
}

export async function analyzeJobMatch(
  jobTitle: string,
  jobDescription: string,
  requirements: string[],
  userProfile: any,
) {
  try {
    const prompt = `
      Analyze how well the candidate matches the job requirements for a ${jobTitle} position.
      
      Job Requirements:
      ${requirements.join("\n")}
      
      Job Description:
      ${jobDescription}
      
      Candidate Information:
      - Professional Title: ${userProfile.title || ""}
      - Experience: ${userProfile.experience_years || ""} years
      - Skills: ${userProfile.skills?.join(", ") || ""}
      - Education: ${userProfile.education || ""}
      
      Provide a match percentage (0-100%) and a brief explanation of strengths and potential gaps. Format your response as JSON with the following structure:
      {
        "matchPercentage": number,
        "strengths": ["strength1", "strength2", ...],
        "gaps": ["gap1", "gap2", ...],
        "summary": "brief summary"
      }
    `

    console.log("Analyzing job match with OpenRouter API using Gemini model")

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://getajobyoapp.vercel.app",
        "X-Title": "GetAJobYo",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro-experimental",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}:`, await response.text())
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = (await response.json()) as OpenRouterResponse
    console.log("Job match analysis completed successfully")
    const matchData = JSON.parse(data.choices[0].message.content)

    return matchData
  } catch (error) {
    console.error("Error analyzing job match:", error)
    return {
      matchPercentage: 50,
      strengths: ["Unable to analyze strengths"],
      gaps: ["Unable to analyze gaps"],
      summary: "Error analyzing job match",
    }
  }
}

export async function autoApplyToJob(jobId: string, userId: string) {
  try {
    const supabase = createBrowserClient()

    // Get job details
    const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", jobId).single()

    if (jobError) throw jobError

    // Get user profile
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError) throw profileError

    // Get user details
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) throw userError

    // Combine user and profile
    const userProfile = { ...user, ...profile }

    // Generate cover letter
    const coverLetter = await generateCoverLetter(job.title, job.company, job.description, userProfile)

    // Create application with cover letter
    const { error: applicationError } = await supabase.from("applications").insert({
      user_id: userId,
      job_id: jobId,
      status: "pending",
      applied_at: new Date().toISOString(),
    })

    if (applicationError) throw applicationError

    // Send application email
    await sendApplicationEmail(jobId, userId, coverLetter)

    return { success: true, coverLetter }
  } catch (error) {
    console.error("Error in auto-apply process:", error)
    throw error
  }
}

// New function to analyze resume and extract information
export async function analyzeResume(resumeText: string) {
  try {
    const prompt = `
      Analyze the following resume and extract key information. Format your response as JSON with the following structure:
      {
        "summary": "brief professional summary",
        "skills": ["skill1", "skill2", ...],
        "experience": [
          {
            "title": "job title",
            "company": "company name",
            "duration": "duration",
            "description": "brief description"
          }
        ],
        "education": [
          {
            "degree": "degree name",
            "institution": "institution name",
            "year": "graduation year"
          }
        ],
        "certifications": ["certification1", "certification2", ...],
        "languages": ["language1", "language2", ...],
        "recommendations": ["recommendation for profile improvement 1", "recommendation 2", ...]
      }
      
      Resume:
      ${resumeText}
    `

    console.log("Analyzing resume with OpenRouter API using Gemini model")

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://getajobyoapp.vercel.app",
        "X-Title": "GetAJobYo",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro-experimental",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}:`, await response.text())
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = (await response.json()) as OpenRouterResponse
    console.log("Resume analysis completed successfully")
    const resumeData = JSON.parse(data.choices[0].message.content)

    return resumeData
  } catch (error) {
    console.error("Error analyzing resume:", error)
    return {
      summary: "Unable to analyze resume",
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      languages: [],
      recommendations: ["Please try uploading your resume again"],
    }
  }
}

// New function to import jobs from Excel or Word
export async function importJobsFromFile(fileContent: string, fileType: "excel" | "word") {
  try {
    const prompt = `
      Parse the following ${fileType} file content and extract job listings. 
      Format each job as a JSON object with the following structure:
      {
        "title": "job title",
        "company": "company name",
        "location": "job location",
        "description": "detailed job description",
        "requirements": ["requirement1", "requirement2", ...],
        "salary_range": "min-max",
        "currency": "USD",
        "rate_period": "yearly",
        "job_type": "full-time/part-time/contract",
        "requires_cover_letter": true/false,
        "additional_fields": {
          "field1": "value1",
          "field2": "value2"
        }
      }
      
      Return an array of these job objects.
      
      File Content:
      ${fileContent}
    `

    console.log(`Parsing ${fileType} file with OpenRouter API using Gemini model`)

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://getajobyoapp.vercel.app",
        "X-Title": "GetAJobYo",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro-experimental",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}:`, await response.text())
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = (await response.json()) as OpenRouterResponse
    console.log("File parsing completed successfully")
    const jobsData = JSON.parse(data.choices[0].message.content)

    return jobsData
  } catch (error) {
    console.error("Error parsing file:", error)
    throw error
  }
}
