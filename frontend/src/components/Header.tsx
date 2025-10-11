import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { LogOut, User, LayoutDashboard } from "lucide-react"

export const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      // You could decode the JWT token to get user email, or fetch from API
      // For now, we'll just show that user is logged in
      setUserEmail("Logged In")
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setUserEmail("")
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <img 
            src="/public/images/college_logo.png" 
            alt="PSG Tech Logo" 
            className="h-10 w-10"
          />
          <div>
            <h1 className="text-xl font-bold text-primary">FIND IT</h1>
            <p className="text-xs text-muted-foreground">PSG Tech Lost & Found</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Home
          </Link>
          <Link 
            to="/about" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === '/about' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            About Us
          </Link>
          {isAuthenticated && (
            <Link 
              to="/dashboard" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Link to="/login">
              <Button size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}