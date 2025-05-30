export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          user_id: string
          job_id: string
          status: string
          cover_letter: string | null
          applied_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          status?: string
          cover_letter?: string | null
          applied_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          status?: string
          cover_letter?: string | null
          applied_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          company: string
          location: string
          description: string
          salary_range: string
          job_type: string
          requirements: string[]
          created_at: string
          updated_at: string
          currency: string
          rate_period: string
          creator_email: string
        }
        Insert: {
          id?: string
          title: string
          company: string
          location: string
          description: string
          salary_range: string
          job_type: string
          requirements: string[]
          created_at?: string
          updated_at?: string
          currency?: string
          rate_period?: string
          creator_email?: string
        }
        Update: {
          id?: string
          title?: string
          company?: string
          location?: string
          description?: string
          salary_range?: string
          job_type?: string
          requirements?: string[]
          created_at?: string
          updated_at?: string
          currency?: string
          rate_period?: string
          creator_email?: string
        }
      }
      profiles: {
        Row: {
          id: string
          title: string | null
          bio: string | null
          resume_url: string | null
          skills: string[] | null
          experience_years: number | null
          education: string | null
          location: string | null
          preferred_job_types: string[] | null
          preferred_locations: string[] | null
          salary_expectation: number | null
          preferred_currency: string | null
          work_experience: Json[] | null
          certifications: string[] | null
          languages: string[] | null
          github_url: string | null
          linkedin_url: string | null
          portfolio_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title?: string | null
          bio?: string | null
          resume_url?: string | null
          skills?: string[] | null
          experience_years?: number | null
          education?: string | null
          location?: string | null
          preferred_job_types?: string[] | null
          preferred_locations?: string[] | null
          salary_expectation?: number | null
          preferred_currency?: string | null
          work_experience?: Json[] | null
          certifications?: string[] | null
          languages?: string[] | null
          github_url?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          bio?: string | null
          resume_url?: string | null
          skills?: string[] | null
          experience_years?: number | null
          education?: string | null
          location?: string | null
          preferred_job_types?: string[] | null
          preferred_locations?: string[] | null
          salary_expectation?: number | null
          preferred_currency?: string | null
          work_experience?: Json[] | null
          certifications?: string[] | null
          languages?: string[] | null
          github_url?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      swipes: {
        Row: {
          id: string
          user_id: string
          job_id: string
          direction: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          direction: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          direction?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
