import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/Header"
import { Link } from "react-router-dom"
import { Users, Target, Heart, Shield, Search, Eye, ArrowRight, ArrowLeft } from "lucide-react"

export const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      
      <main className="container py-16 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/college_logo.png" 
              alt="PSG Tech Logo" 
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary">About FIND IT</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A dedicated platform for PSG Tech students to recover lost items and help fellow students 
            find their belongings through our community-driven lost and found system.
          </p>
        </section>

        {/* Mission Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To create a seamless platform where PSG Tech students can quickly report and recover 
                lost items, fostering a helpful community spirit.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-success/10 rounded-full">
                  <Heart className="h-8 w-8 text-success" />
                </div>
              </div>
              <CardTitle>Our Values</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Built on trust, community support, and the shared goal of helping fellow students. 
                We believe in the power of collective responsibility.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-warning/10 rounded-full">
                  <Shield className="h-8 w-8 text-warning" />
                </div>
              </div>
              <CardTitle>Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your data is secure and only accessible to verified PSG Tech students. 
                We prioritize your privacy while facilitating connections.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* How It Works */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-4">How FIND IT Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, fast, and effective. Help the PSG Tech community stay connected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-destructive/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Search className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-destructive">Lost Something?</CardTitle>
                    <CardDescription>Report your lost item</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Quickly fill out a form with details about your lost item. Include description, 
                  location, and date to help others identify it.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Detailed item description</li>
                  <li>• Location where you lost it</li>
                  <li>• Date and time information</li>
                  <li>• Contact information</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-success/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Eye className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-success">Found Something?</CardTitle>
                    <CardDescription>Help someone recover their item</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Spotted a lost item? Report it to help the owner find it. Your small action 
                  can make someone's day better.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Describe what you found</li>
                  <li>• Specify the exact location</li>
                  <li>• Add any helpful remarks</li>
                  <li>• System matches with lost reports</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Section 
        <section className="bg-primary/5 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-8">Making a Difference</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100+</div>
              <p className="text-muted-foreground">Items Reunited</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Active Students</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <p className="text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </section>
      */}
        {/* CAn add our name in future */}
        <section className="text-center space-y-6">
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            
            <Link to="/">
              <Button variant="outline" size="lg">
              <ArrowLeft className="h-5 w-5" />
                Back to Home
              </Button>
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center bg-muted/50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-primary mb-4">Questions or Feedback?</h3>
          <p className="text-muted-foreground mb-4">
            We're here to help make FIND IT better for everyone.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact us: <a href="https://mail.google.com/mail/?view=cm&fs=1&to=finditpsg@gmail.com" className="font-medium text-primary hover:underline cursor-pointer" target="_blank" rel="noopener noreferrer">finditpsg@gmail.com</a>
          </p>
        </section>
      </main>
    </div>
  )
}

export default About