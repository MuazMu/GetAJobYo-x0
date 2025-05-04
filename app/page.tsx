import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageTransition } from "@/components/page-transition"
import { ArrowRight, CheckCircle, Briefcase, User, FileText } from "lucide-react"
import AppHeader from "@/components/app-header"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <PageTransition>
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Find Your Dream Job with GetAJobYo
                  </h1>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                    The smart job application platform that helps you find, apply, and land your perfect job.
                  </p>
                </div>
                <div className="space-x-4">
                  <Link href="/signup">
                    <Button className="h-11 px-8">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="h-11 px-8">
                      Log In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Features</h2>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                    Everything you need to streamline your job search and application process.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
                  <div className="flex flex-col items-center space-y-2">
                    <Briefcase className="h-12 w-12 text-primary" />
                    <h3 className="text-xl font-bold">Job Matching</h3>
                    <p className="text-muted-foreground">
                      AI-powered job matching to find positions that fit your skills and preferences.
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <FileText className="h-12 w-12 text-primary" />
                    <h3 className="text-xl font-bold">Auto Apply</h3>
                    <p className="text-muted-foreground">
                      Automatically generate cover letters and apply to jobs with a single click.
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <User className="h-12 w-12 text-primary" />
                    <h3 className="text-xl font-bold">Profile Analysis</h3>
                    <p className="text-muted-foreground">
                      Get insights on how to improve your profile to attract better job opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Why Choose GetAJobYo?</h2>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                    Our platform is designed to make your job search efficient and effective.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-8">
                  <div className="flex items-start space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-bold">AI-Powered Matching</h3>
                      <p className="text-muted-foreground">
                        Our AI analyzes your skills and preferences to find the perfect job matches.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-bold">Time-Saving Automation</h3>
                      <p className="text-muted-foreground">
                        Automatically generate cover letters and apply to jobs with a single click.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-bold">Application Tracking</h3>
                      <p className="text-muted-foreground">
                        Keep track of all your applications and their statuses in one place.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-bold">Profile Optimization</h3>
                      <p className="text-muted-foreground">
                        Get insights on how to improve your profile to attract better job opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to Get Started?</h2>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                    Join thousands of job seekers who have found their dream jobs with GetAJobYo.
                  </p>
                </div>
                <div className="space-x-4">
                  <Link href="/signup">
                    <Button className="h-11 px-8">
                      Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </PageTransition>
    </div>
  )
}
