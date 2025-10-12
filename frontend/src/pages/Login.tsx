import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/Header"
import { Mail, Lock, User, School } from "lucide-react"
import axios from 'axios';

// Student login API call
const apiStudentLogin = async (email: string, password: string) => {
  try {
    const response = await axios.post('http://localhost:8080/api/login', { email, password });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Login failed" };
  }
};

// Admin login API call
const apiAdminLogin = async (email: string, password: string) => {
  try {
    const response = await axios.post('http://localhost:8080/admin/login', { email, password });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Admin login failed" };
  }
};

const apiRegister = async (name: string, email: string, studentId: string, password: string) => {
  try {
    const response = await axios.post('http://localhost:8080/api/register', { name, email, studentId, password });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Registration failed" };
  }
};

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
  const navigate = useNavigate()

  // ✅ LOGIN HANDLER (Fixed - uses correct endpoints)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const isAdmin = loginData.email === "finditpsg@gmail.com"; 

    // Restrict non-admin users to PSG domain
    if (!isAdmin && !loginData.email.endsWith("@psgtech.ac.in")) {
      toast({
        title: "Invalid email domain",
        description: "Please use your PSG Tech email (@psgtech.ac.in)",
        variant: "destructive"
      });
      return;
    }

    // Use different API endpoints based on user type
    const result = isAdmin 
      ? await apiAdminLogin(loginData.email, loginData.password)
      : await apiStudentLogin(loginData.email, loginData.password);

    toast({
      title: result.success ? "Login successful!" : "Login failed",
      description: result.message,
      variant: result.success ? undefined : "destructive"
    });

    if (result.success) {
      // Store token (admin uses 'token', student uses 'data.token')
      const token = result.token || result.data?.token;
      if (token) {
        const storageKey = isAdmin ? 'adminToken' : 'token';
        localStorage.setItem(storageKey, token);
      }
      
      setLoginData({ email: "", password: "" });

      // Redirect based on user type
      // Redirect based on user type
      if (isAdmin) {
        navigate('/admin/dashboard');  // ✅ Correct route
      } else {
        navigate('/dashboard');
      }
    }
  };

  // ✅ REGISTER HANDLER (unchanged)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData.email.endsWith("@psgtech.ac.in")) {
      toast({
        title: "Invalid email domain",
        description: "Please use your PSG Tech email (@psgtech.ac.in)",
        variant: "destructive"
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive"
      });
      return;
    }

    const result = await apiRegister(
      registerData.name,
      registerData.email,
      registerData.studentId,
      registerData.password
    );
    toast({
      title: result.success ? "Account created successfully!" : "Registration failed",
      description: result.message,
      variant: result.success ? undefined : "destructive"
    });

    if (result.success) {
      localStorage.setItem('token', result.data.token);
      setRegisterData({
        name: "",
        email: "",
        studentId: "",
        password: "",
        confirmPassword: ""
      });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/public/images/college_logo.png" 
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
            
            {/* LOGIN TAB */}
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
                        Email
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="roll@psgtech.ac.in"
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

            {/* REGISTER TAB */}
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
                        placeholder="rollno@psgtech.ac.in"
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