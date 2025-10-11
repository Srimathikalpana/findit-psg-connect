import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/Header"
import { LostItemForm } from "@/components/LostItemForm"
import { FoundItemForm } from "@/components/FoundItemForm"
import { Link } from "react-router-dom"
import { Search, Eye, ArrowLeft } from "lucide-react"

const Report = () => {
  const [activeForm, setActiveForm] = useState<'none' | 'lost' | 'found'>('none')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      
      <main className="container py-16 space-y-16">
        {/* Header Section */}
        <section className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/college_logo.png" 
              alt="PSG Tech Logo" 
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary">Report Items</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          </p>
          
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
            <>
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
              
              <div className="flex justify-center mt-8">
                <Link to="/dashboard">
                  <Button variant="outline" size="lg" className="gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </>
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
      </main>
    </div>
  )
}

export default Report
