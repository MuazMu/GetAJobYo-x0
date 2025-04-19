import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { PageTransition } from "@/components/page-transition"
import { ArrowRight, Briefcase, CheckCircle, Sparkles, Zap, ThumbsUp, Award } from "lucide-react"
// Import the AppHeader component at the top of the file
import { AppHeader } from "@/components/app-header"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <PageTransition>
          {/* Hero Section */}
          <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-background via-background to-purple-50 dark:from-background dark:via-background dark:to-purple-950/20">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="space-y-2 max-w-3xl">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-gradient">
                    Swipe Your Way to Career Success
                  </h1>
                  <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400 mt-4">
                    GetAJobYo revolutionizes your job search with AI-powered matching and one-swipe applications. Find
                    your dream job in seconds, not hours.
                  </p>
                </div>
                <div className="space-x-4 mt-8">
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg"
                    >
                      Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-2 hover:bg-muted/50 transition-all duration-300 px-8 py-6 text-lg"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
                <p className="mt-4 text-xl text-muted-foreground">Simplifying your job search in three easy steps</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <ThumbsUp className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">Swipe Right</h3>
                  <p className="text-muted-foreground">
                    See a job you love? Swipe right to instantly apply with your profile and AI-generated cover letter.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Zap className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">AI-Powered Matching</h3>
                  <p className="text-muted-foreground">
                    Our AI analyzes your skills and experience to find the perfect job matches and creates personalized
                    cover letters.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Briefcase className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">Get Hired</h3>
                  <p className="text-muted-foreground">
                    Track your applications, receive interview invitations, and land your dream job faster than ever.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-background to-muted">
            <div className="container px-4 md:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">
                    Why Choose GetAJobYo?
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Save Time</h3>
                        <p className="text-muted-foreground">
                          No more endless scrolling and filling out applications. Swipe and apply in seconds.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">AI-Powered Applications</h3>
                        <p className="text-muted-foreground">
                          Our AI creates personalized cover letters that highlight your relevant skills and experience.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Smart Matching</h3>
                        <p className="text-muted-foreground">
                          Get matched with jobs that align with your skills, experience, and preferences.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Track Your Progress</h3>
                        <p className="text-muted-foreground">
                          Monitor all your applications in one place with real-time status updates.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-8 shadow-lg border">
                  <div className="text-center mb-6">
                    <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">Join Thousands of Successful Job Seekers</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-background rounded-lg p-4 border">
                      <p className="italic text-muted-foreground">
                        "I found my dream job in just two days using GetAJobYo. The AI-generated cover letter was
                        perfect!"
                      </p>
                      <div className="mt-2 font-semibold">— Sarah T., Software Engineer</div>
                    </div>

                    <div className="bg-background rounded-lg p-4 border">
                      <p className="italic text-muted-foreground">
                        "The job matching was spot on. I received three interview offers in my first week!"
                      </p>
                      <div className="mt-2 font-semibold">— Michael R., Marketing Manager</div>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <Link href="/signup">
                      <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                        Create Your Free Account
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
            <div className="container px-4 md:px-6 text-center">
              <Award className="h-16 w-16 mx-auto mb-6" />
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                Ready to Transform Your Job Search?
              </h2>
              <p className="mx-auto max-w-[700px] text-xl mb-8">
                Join GetAJobYo today and start swiping your way to career success.
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg"
                >
                  Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </section>
        </PageTransition>
      </main>
      <MainNav />
    </div>
  )
}
