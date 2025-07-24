import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/Header"
import { Mail, Lock, User, School } from "lucide-react"

export const Login = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ 
    name: "", 
    email: "", 
    studentId: "", 
    password: "", 
    confirmPassword: "" 
  })
  const { toast } = useToast()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginData.email.endsWith("@psgtech.ac.in")) {
      toast({
        title: "Invalid email domain",
        description: "Please use your PSG Tech email (@psgtech.ac.in)",
        variant: "destructive"
      })
      return
    }

    // Simulate login
    toast({
      title: "Login successful!",
      description: "Welcome back to FIND IT",
    })
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registerData.email.endsWith("@psgtech.ac.in")) {
      toast({
        title: "Invalid email domain",
        description: "Please use your PSG Tech email (@psgtech.ac.in)",
        variant: "destructive"
      })
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive"
      })
      return
    }

    // Simulate registration
    toast({
      title: "Account created successfully!",
      description: "Welcome to FIND IT - PSG Tech Lost & Found",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/lovable-uploads/8b0a2ced-6628-4683-a80f-ca165650f80c.png" 
              alt="PSG Tech Logo" 
              className="h-20 w-20 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-primary">FIND IT</h1>
            <p className="text-muted-foreground">PSG Tech Lost & Found Platform</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to your PSG Tech account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        PSG Tech Email
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.name@psgtech.ac.in"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" size="lg">
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join the PSG Tech Lost & Found community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Your full name"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        PSG Tech Email
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your.name@psgtech.ac.in"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-studentId" className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        Student ID
                      </Label>
                      <Input
                        id="register-studentId"
                        type="text"
                        placeholder="Your student ID"
                        value={registerData.studentId}
                        onChange={(e) => setRegisterData({...registerData, studentId: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">Confirm Password</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                    
                    <Button type="submit" variant="hero" className="w-full" size="lg">
                      Create Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Login