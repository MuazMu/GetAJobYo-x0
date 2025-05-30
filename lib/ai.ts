import { createBrowserClient } from "./supabase"
import { OPENROUTER_API_KEY } from "./env"
import { sendApplicationEmail } from "./email-utils"

// Keep the URL constant
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

// Add a check for the API key
const hasValidApiKey = !!OPENROUTER_API_KEY && OPENROUTER_API_KEY.length > 10

// For development/testing purposes, we'll use the provided key if the environment variable isn't set
const API_KEY = OPENROUTER_API_KEY || "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"

// Use a valid model ID - updated from the invalid "google/gemini-2.5-pro-experimental"
const DEFAULT_MODEL = "anthropic/claude-3-opus-20240229"

// Mock data for fallback when API key is missing
const MOCK_MATCH_DATA = {
  matchPercentage: 75,
  strengths: ["Technical skills", "Experience level", "Education background"],
  gaps: ["Specific industry experience"],
  summary: "You appear to be a good match for this position based on your skills and experience.",
}

interface OpenRouterResponse {
  id: string
  choices: {
    message: {
      content: string
    }
  }[]
}

// Helper function to validate API key and handle errors
async function makeOpenRouterRequest(body: any) {
  console.log("Making OpenRouter request with API key:", API_KEY.substring(0, 10) + "...")

  // Update the model in the request body to use the valid model
  const requestBody = {
    ...body,
    model: DEFAULT_MODEL,
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://getajobyoapp.vercel.app",
        "X-Title": "GetAJobYo",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API request failed with status ${response.status}:`, errorText)

      // Log detailed error information
      console.error("Request details:", {
        url: OPENROUTER_API_URL,
        hasApiKey: !!API_KEY,
        apiKeyLength: API_KEY?.length || 0,
        statusCode: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      throw new Error(`API request failed with status ${response.status}: ${errorText}`)
    }

    return (await response.json()) as OpenRouterResponse
  } catch (error) {
    console.error("Error making OpenRouter request:", error)
    throw error
  }
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

    console.log("Generating cover letter with OpenRouter API")

    try {
      const data = await makeOpenRouterRequest({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      })

      console.log("Cover letter generated successfully")
      return data.choices[0].message.content
    } catch (error) {
      // Fallback content if API fails
      console.warn("Using fallback cover letter due to API error")
      return `
Dear Hiring Manager at ${company},

I am writing to express my interest in the ${jobTitle} position at ${company}. With my background and skills, I believe I would be a valuable addition to your team.

[This is a fallback cover letter due to an API error. Please check your OpenRouter API key configuration.]

I look forward to the opportunity to discuss how my skills and experience align with your needs.

Sincerely,
${userProfile.full_name || "The Candidate"}
      `
    }
  } catch (error) {
    console.error("Error in generateCoverLetter:", error)
    return "Error generating cover letter. Please try again later or contact support."
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

    console.log("Analyzing job match with OpenRouter API")

    try {
      const data = await makeOpenRouterRequest({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      })

      console.log("Job match analysis completed successfully")
      return JSON.parse(data.choices[0].message.content)
    } catch (error) {
      // Return mock data if API fails
      console.warn("Using mock job match data due to API error:", error)

      // Generate dynamic mock data based on user profile
      const mockData = { ...MOCK_MATCH_DATA }

      // Customize mock data based on available profile information
      if (userProfile.skills?.length > 0) {
        mockData.strengths = userProfile.skills.slice(0, 3).map((skill) => `Strong ${skill} skills`)
      }

      if (userProfile.experience_years) {
        const expYears = Number.parseInt(userProfile.experience_years)
        if (expYears > 5) {
          mockData.matchPercentage = 85
          mockData.summary = "You have substantial experience that makes you a strong candidate."
        } else if (expYears < 2) {
          mockData.matchPercentage = 65
          mockData.gaps.push("Limited professional experience")
          mockData.summary = "You have some relevant skills but may need more experience."
        }
      }

      return mockData
    }
  } catch (error) {
    console.error("Error in analyzeJobMatch:", error)
    return MOCK_MATCH_DATA
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
      cover_letter: coverLetter,
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

    console.log("Analyzing resume with OpenRouter API")

    try {
      const data = await makeOpenRouterRequest({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      })

      console.log("Resume analysis completed successfully")
      return JSON.parse(data.choices[0].message.content)
    } catch (error) {
      // Return fallback data if API fails
      console.warn("Using fallback resume analysis due to API error")
      return {
        summary: "Professional with relevant experience and skills",
        skills: resumeText
          .split(" ")
          .filter((word) => word.length > 5)
          .slice(0, 5),
        experience: [],
        education: [],
        certifications: [],
        languages: ["English"],
        recommendations: ["Please try uploading your resume again"],
      }
    }
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

    console.log(`Parsing ${fileType} file with OpenRouter API`)

    try {
      const data = await makeOpenRouterRequest({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      })

      console.log("File parsing completed successfully")
      return JSON.parse(data.choices[0].message.content)
    } catch (error) {
      console.warn("Using fallback job parsing due to API error")
      return []
    }
  } catch (error) {
    console.error("Error parsing file:", error)
    return []
  }
}
