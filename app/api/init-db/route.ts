import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Read the SQL file content
    const sqlContent = `
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
      applied_at TIMESTAMP WITH TIME ZONE,
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
    
    -- Enable Row Level Security (RLS) on all tables
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
    ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for users table
    DROP POLICY IF EXISTS users_select_policy ON users;
    DROP POLICY IF EXISTS users_insert_policy ON users;
    DROP POLICY IF EXISTS users_update_policy ON users;
    DROP POLICY IF EXISTS users_delete_policy ON users;
    
    CREATE POLICY users_select_policy ON users
      FOR SELECT USING (auth.uid() = id OR auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com');
    
    CREATE POLICY users_insert_policy ON users
      FOR INSERT WITH CHECK (auth.uid() = id OR auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com');
    
    CREATE POLICY users_update_policy ON users
      FOR UPDATE USING (auth.uid() = id OR auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com');
    
    CREATE POLICY users_delete_policy ON users
      FOR DELETE USING (auth.uid() = id OR auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com');
    
    -- Create policies for profiles table
    DROP POLICY IF EXISTS profiles_select_policy ON profiles;
    DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
    DROP POLICY IF EXISTS profiles_update_policy ON profiles;
    DROP POLICY IF EXISTS profiles_delete_policy ON profiles;
    
    CREATE POLICY profiles_select_policy ON profiles
      FOR SELECT USING (auth.uid() = id OR auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com');
    
    CREATE POLICY profiles_insert_policy ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id OR auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com');
    
    CREATE POLICY profiles_update_policy ON profiles
      FOR UPDATE USING (auth.uid() = id OR auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com');
    
    CREATE POLICY profiles_delete_policy ON profiles
      FOR DELETE USING (auth.uid() = id OR auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com');
    
    -- Create policies for jobs table
    DROP POLICY IF EXISTS jobs_select_policy ON jobs;
    DROP POLICY IF EXISTS jobs_insert_policy ON jobs;
    DROP POLICY IF EXISTS jobs_update_policy ON jobs;
    DROP POLICY IF EXISTS jobs_delete_policy ON jobs;
    
    CREATE POLICY jobs_select_policy ON jobs
      FOR SELECT USING (true); -- Anyone can view jobs
    
    CREATE POLICY jobs_insert_policy ON jobs
      FOR INSERT WITH CHECK (auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com' OR 
                             auth.jwt() ->> 'email' = creator_email);
    
    CREATE POLICY jobs_update_policy ON jobs
      FOR UPDATE USING (auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com' OR 
                        auth.jwt() ->> 'email' = creator_email);
    
    CREATE POLICY jobs_delete_policy ON jobs
      FOR DELETE USING (auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com' OR 
                        auth.jwt() ->> 'email' = creator_email);
    
    -- Create policies for applications table
    DROP POLICY IF EXISTS applications_select_policy ON applications;
    DROP POLICY IF EXISTS applications_insert_policy ON applications;
    DROP POLICY IF EXISTS applications_update_policy ON applications;
    DROP POLICY IF EXISTS applications_delete_policy ON applications;
    
    CREATE POLICY applications_select_policy ON applications
      FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com' OR
        EXISTS (
          SELECT 1 FROM jobs 
          WHERE jobs.id = applications.job_id AND 
                jobs.creator_email = auth.jwt() ->> 'email'
        )
      );
    
    CREATE POLICY applications_insert_policy ON applications
      FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com'
      );
    
    CREATE POLICY applications_update_policy ON applications
      FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com' OR
        EXISTS (
          SELECT 1 FROM jobs 
          WHERE jobs.id = applications.job_id AND 
                jobs.creator_email = auth.jwt() ->> 'email'
        )
      );
    
    CREATE POLICY applications_delete_policy ON applications
      FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com'
      );
    
    -- Create policies for swipes table
    DROP POLICY IF EXISTS swipes_select_policy ON swipes;
    DROP POLICY IF EXISTS swipes_insert_policy ON swipes;
    DROP POLICY IF EXISTS swipes_update_policy ON swipes;
    DROP POLICY IF EXISTS swipes_delete_policy ON swipes;
    
    CREATE POLICY swipes_select_policy ON swipes
      FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com'
      );
    
    CREATE POLICY swipes_insert_policy ON swipes
      FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com'
      );
    
    CREATE POLICY swipes_update_policy ON swipes
      FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com'
      );
    
    CREATE POLICY swipes_delete_policy ON swipes
      FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'email' LIKE '%@getajobyoapp.com'
      );
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent })

    if (error) {
      console.error("Error initializing database:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Database initialized successfully with RLS policies" })
  } catch (error) {
    console.error("Unexpected error initializing database:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
