# GetAJobYo

A modern job application platform with AI-powered matching and application features.

## Features

- Job browsing with swipe interface
- AI-powered job matching
- Automatic cover letter generation
- Profile management
- Application tracking
- Salary calculator with currency conversion
- Email notifications for job applications

## Environment Variables

The application requires the following environment variables:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Integration
OPENROUTER_API_KEY=your_openrouter_api_key

# Email Integration
SENDGRID_API_KEY=your_sendgrid_api_key
\`\`\`

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up the environment variables in a `.env.local` file
4. Run the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

The application requires a Supabase database with the following tables:

- users
- profiles
- jobs
- applications
- swipes

You can initialize the database by visiting `/api/init-db` after setting up your Supabase credentials.

## Email Notifications

The application uses SendGrid to send email notifications when users apply for jobs. The job creator will receive an email with the applicant's information and cover letter.

To set up email notifications:

1. Create a SendGrid account and get an API key
2. Add the API key to your environment variables as `SENDGRID_API_KEY`
3. Update the sender email in `app/api/send-email/route.ts` if needed

## License

This project is licensed under the MIT License.
\`\`\`

Let's also add a notification to the user when they apply for a job:
