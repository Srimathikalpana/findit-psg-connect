import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/Header"
import { LostItemForm } from "@/components/LostItemForm"
import { FoundItemForm } from "@/components/FoundItemForm"
import { Link } from "react-router-dom"
import { Search, Eye, ArrowRight, Users, MapPin, Clock } from "lucide-react"

const Index = () => {
  const [activeForm, setActiveForm] = useState<'none' | 'lost' | 'found'>('none')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      
      <main className="container py-16 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/college_logo.png" 
              alt="PSG Tech Logo" 
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary">
            Welcome to <span className="text-gradient bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">FIND IT</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The official PSG Tech Lost & Found platform. Help your fellow students recover lost items 
            and get your belongings back faster than ever.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button variant="hero" size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Active Students</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-success/10 rounded-full">
                  <MapPin className="h-8 w-8 text-success" />
                </div>
              </div>
              <div className="text-3xl font-bold text-success mb-2">100+</div>
              <p className="text-muted-foreground">Items Recovered</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-warning/10 rounded-full">
                  <Clock className="h-8 w-8 text-warning" />
                </div>
              </div>
              <div className="text-3xl font-bold text-warning mb-2">24hrs</div>
              <p className="text-muted-foreground">Average Recovery Time</p>
            </CardContent>
          </Card>
        </section>

        {/* Main Actions */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-4">What would you like to do?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose an option below to report a lost item or help someone find their belongings.
            </p>
          </div>

          {activeForm === 'none' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card 
                className="cursor-pointer border-2 border-destructive/20 hover:border-destructive/40 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                onClick={() => setActiveForm('lost')}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-destructive/10 rounded-full">
                      <Search className="h-8 w-8 text-destructive" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-destructive">I Lost Something</CardTitle>
                  <CardDescription className="text-base">
                    Report your lost item and get help from the PSG Tech community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-destructive rounded-full"></div>
                      Fill out a detailed description
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-destructive rounded-full"></div>
                      Get notified if someone finds it
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-destructive rounded-full"></div>
                      Connect with helpful students
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full mt-6 border-destructive/20 text-destructive hover:bg-destructive/10">
                    Report Lost Item
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer border-2 border-success/20 hover:border-success/40 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                onClick={() => setActiveForm('found')}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-success/10 rounded-full">
                      <Eye className="h-8 w-8 text-success" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-success">I Found Something</CardTitle>
                  <CardDescription className="text-base">
                    Help a fellow student by reporting an item you found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-success rounded-full"></div>
                      Quick and easy reporting
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-success rounded-full"></div>
                      Automatic owner matching
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-success rounded-full"></div>
                      Make someone's day better
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full mt-6 border-success/20 text-success hover:bg-success/10">
                    Report Found Item
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeForm === 'lost' && (
            <div className="space-y-6">
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveForm('none')}
                  className="gap-2"
                >
                  ← Back to Options
                </Button>
              </div>
              <LostItemForm />
            </div>
          )}

          {activeForm === 'found' && (
            <div className="space-y-6">
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveForm('none')}
                  className="gap-2"
                >
                  ← Back to Options
                </Button>
              </div>
              <FoundItemForm />
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="bg-muted/50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-primary mb-6 text-center">Recent Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Search className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">iPhone 13 Pro</p>
                    <p className="text-sm text-muted-foreground">Lost near Library</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Eye className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Blue Backpack</p>
                    <p className="text-sm text-muted-foreground">Found in Cafeteria</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium">Wrist Watch</p>
                    <p className="text-sm text-muted-foreground">Reunited! 🎉</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Index
