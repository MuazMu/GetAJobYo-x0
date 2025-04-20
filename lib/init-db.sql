-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id),
  title TEXT,
  bio TEXT,
  resume_url TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  education TEXT,
  location TEXT,
  preferred_job_types TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  salary_expectation INTEGER,
  work_experience JSONB[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  salary_range TEXT NOT NULL,
  job_type TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  currency TEXT DEFAULT 'USD',
  rate_period TEXT DEFAULT 'yearly',
  creator_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  job_id UUID REFERENCES jobs(id) NOT NULL,
  status TEXT DEFAULT 'pending',
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create swipes table if it doesn't exist
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  job_id UUID REFERENCES jobs(id) NOT NULL,
  direction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
