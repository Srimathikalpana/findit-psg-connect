import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/Header"
import { Link } from "react-router-dom"
import { ArrowRight, Users, MapPin, Clock, Search, Eye } from "lucide-react"

interface Stats {
  totalUsers: number;
  completedClaims: number;
}

interface RecentClaim {
  id: string;
  lostItemName: string;
  foundItemName: string;
  placeLost: string;
  placeFound: string;
  approvedDate: string;
}

const Index = () => {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, completedClaims: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [animatedStats, setAnimatedStats] = useState<Stats>({ totalUsers: 0, completedClaims: 0 })
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([])
  const [claimsLoading, setClaimsLoading] = useState(true)

  // Animation function
  const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
    const startTime = performance.now()
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.floor(start + (end - start) * easeOutQuart)
      
      callback(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/users/stats/public')
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
          
          // Start animations
          animateValue(0, data.data.totalUsers, 2000, (value) => {
            setAnimatedStats(prev => ({ ...prev, totalUsers: value }))
          })
          
          animateValue(0, data.data.completedClaims, 2000, (value) => {
            setAnimatedStats(prev => ({ ...prev, completedClaims: value }))
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    const fetchRecentClaims = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/recent-claims')
        const data = await response.json()
        if (data.success) {
          setRecentClaims(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch recent claims:', error)
      } finally {
        setClaimsLoading(false)
      }
    }

    fetchStats()
    fetchRecentClaims()
  }, [])

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
          
          {/*<div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </div>*/}
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
              <div className="text-3xl font-bold text-primary mb-2">
                {statsLoading ? '...' : `${animatedStats.totalUsers}+`}
              </div>
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
              <div className="text-3xl font-bold text-success mb-2">
                {statsLoading ? '...' : `${animatedStats.completedClaims}+`}
              </div>
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

        {/* Call to Action */}
        <section className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-primary">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the FindIt community to make our campus a more connected and helpful place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button variant="hero" size="lg" className="gap-2">
                Join FindIt
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

        {/* Recent Activity */}
        <section className="bg-muted/50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-primary mb-6 text-center">Recent Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {claimsLoading ? (
              // Loading state
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <div className="h-4 w-4 bg-muted animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2"></div>
                        <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <div className="h-4 w-4 bg-muted animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2"></div>
                        <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <div className="h-4 w-4 bg-muted animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2"></div>
                        <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : recentClaims.length > 0 ? (
              // Display actual claims
              recentClaims.map((claim, index) => (
                <Card key={claim.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${index === 0 ? 'bg-destructive/10' : index === 1 ? 'bg-success/10' : 'bg-warning/10'} rounded-lg`}>
                        {index === 0 ? (
                          <Search className="h-4 w-4 text-destructive" />
                        ) : index === 1 ? (
                          <Eye className="h-4 w-4 text-success" />
                        ) : (
                          <Clock className="h-4 w-4 text-warning" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{claim.lostItemName}</p>
                        <p className="text-sm text-muted-foreground">
                          {index === 2 ? 'Reunited! 🎉' : `Found in ${claim.placeFound}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // No claims state
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-destructive/10 rounded-lg">
                        <Search className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">No Recent Claims</p>
                        <p className="text-sm text-muted-foreground">Be the first to help!</p>
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
                        <p className="font-medium">No Recent Claims</p>
                        <p className="text-sm text-muted-foreground">Be the first to help!</p>
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
                        <p className="font-medium">No Recent Claims</p>
                        <p className="text-sm text-muted-foreground">Be the first to help!</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Index
