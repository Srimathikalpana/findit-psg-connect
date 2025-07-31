import { Button } from "@/components/ui/button"
import { Link, useLocation } from "react-router-dom"
import { LogOut, User } from "lucide-react"

interface HeaderProps {
  isAuthenticated?: boolean
  onLogout?: () => void
  userEmail?: string
}

export const Header = ({ isAuthenticated = false, onLogout, userEmail }: HeaderProps) => {
  const location = useLocation()

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
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{userEmail}</span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
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