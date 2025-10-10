import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/Header"
import { ClaimDialog } from "@/components/ClaimDialog"
import { 
  Search, 
  Eye, 
  Calendar, 
  MapPin, 
  Package, 
  User, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"

interface LostItem {
  _id: string
  itemName: string
  description: string
  placeLost: string
  dateLost: string
  category: string
  color?: string
  brand?: string
  status: string
  createdAt: string
  contactInfo?: {
    phone?: string
    email?: string
  }
  claimedCounterpart?: {
    name: string
    studentId: string
    email: string
    phone?: string
  }
  potentialMatches?: Array<{
    foundItem: FoundItem;
    similarity: number;
    locationMatch: boolean;
    timeValid: boolean;
  }>;
}

interface FoundItem {
  _id: string
  itemName: string
  description: string
  placeFound: string
  dateFound: string
  category: string
  color?: string
  brand?: string
  status: string
  createdAt: string
  storageLocation?: string
  verificationQuestion: string
  correctAnswer: string
  contactInfo?: {
    phone?: string
    email?: string
  }
  claimedCounterpart?: {
    name: string
    studentId: string
    email: string
    phone?: string
  }
}

interface UserData {
  _id: string
  name: string
  email: string
  studentId: string
  role: string
}

const Dashboard = () => {
  const [user, setUser] = useState<UserData | null>(null)
  const [lostItems, setLostItems] = useState<LostItem[]>([])
  const [foundItems, setFoundItems] = useState<FoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchUserData()
    fetchUserItems()
  }, [navigate])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8080/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setUser(response.data.data)
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
      }
    }
  }

  const fetchUserItems = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8080/api/my-items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        // Get potential matches for each lost item
        const lostItemsWithMatches = await Promise.all(
          response.data.data.lostItems.map(async (item: LostItem) => {
            try {
              const matchesResponse = await axios.get(
                `http://localhost:8080/api/lost-items/${item._id}/matches`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              return {
                ...item,
                potentialMatches: matchesResponse.data.data || []
              };
            } catch (error) {
              console.error(`Error fetching matches for item ${item._id}:`, error);
              return item;
            }
          })
        );

        setLostItems(lostItemsWithMatches)
        setFoundItems(response.data.data.foundItems || [])
      }
    } catch (error: any) {
      console.error('Error fetching user items:', error)
      toast({
        title: "Error loading items",
        description: "Failed to load your items. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string, type: 'lost' | 'found') => {
    try {
      const token = localStorage.getItem('token')
      const endpoint = type === 'lost' ? 'lost-items' : 'found-items'
      
      await axios.delete(`http://localhost:8080/api/${endpoint}/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      toast({
        title: "Item deleted successfully",
        description: "The item has been removed from your list.",
      })

      // Refresh the items list
      fetchUserItems()
    } catch (error: any) {
      console.error('Error deleting item:', error)
      toast({
        title: "Error deleting item",
        description: error.response?.data?.message || "Failed to delete item.",
        variant: "destructive"
      })
    }
  }

  const handleClaim = async (lostItemId: string, foundItemId: string, verificationQuestion: string) => {
    try {
      const answer = window.prompt(verificationQuestion)
      if (!answer) return

      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:8080/api/claims/verify-and-claim', {
        lostItemId,
        foundItemId,
        answer
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        toast({ title: 'Claim successful', description: 'Verification passed. Items marked as claimed.' })
        // Update local status immediately
        setLostItems(prev => prev.map(li => li._id === lostItemId ? { ...li, status: 'claimed' } : li))
        setFoundItems(prev => prev.map(fi => fi._id === foundItemId ? { ...fi, status: 'claimed' } : fi))
      } else {
        toast({ title: 'Verification failed', description: response.data.message || 'Incorrect answer.', variant: 'destructive' })
      }
    } catch (error: any) {
      toast({ title: 'Claim failed', description: error.response?.data?.message || 'Please try again.', variant: 'destructive' })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Active</Badge>
      case 'claimed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Claimed</Badge>
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header />
        <div className="container py-16">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      
      <main className="container py-16 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your lost and found items
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lost Items</p>
                  <p className="text-2xl font-bold text-destructive">{lostItems.length}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full">
                  <Search className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Found Items</p>
                  <p className="text-2xl font-bold text-success">{foundItems.length}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-full">
                  <Eye className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-primary">{lostItems.length + foundItems.length}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/')}
            variant="outline" 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Report New Item
          </Button>
        </div>

        {/* Items Tabs */}
        <Tabs defaultValue="lost" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lost" className="gap-2">
              <Search className="h-4 w-4" />
              Lost Items ({lostItems.length})
            </TabsTrigger>
            <TabsTrigger value="found" className="gap-2">
              <Eye className="h-4 w-4" />
              Found Items ({foundItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lost" className="space-y-4">
            {lostItems.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-muted rounded-full">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No lost items yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't reported any lost items. Click the button below to report your first lost item.
                  </p>
                  <Button onClick={() => navigate('/')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Report Lost Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {lostItems.map(item => (
                  <Card key={item._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{item.itemName}</CardTitle>
                          <CardDescription>{item.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.status)}
                          {item.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item._id, 'lost')}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Lost on {formatDate(item.dateLost)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{item.placeLost}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{item.category}</span>
                        </div>
                        {item.brand && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{item.brand}</span>
                          </div>
                        )}
                      </div>
                      {item.status === 'claimed' && item.claimedCounterpart && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Contact Information:</p>
                          <p className="text-sm">Name: {item.claimedCounterpart.name} ({item.claimedCounterpart.studentId})</p>
                          <p className="text-sm">Mailid: {item.claimedCounterpart.email}</p>
                          {item.claimedCounterpart.phone && <p className="text-sm">Phone: {item.claimedCounterpart.phone}</p>}
                        </div>
                      )}
                    </CardContent>
                    {item.status === 'active' && item.potentialMatches && item.potentialMatches.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-medium">Potential Matches</h4>
                        {[...item.potentialMatches].sort((a, b) => b.similarity - a.similarity).map(match => (
                          <div key={match.foundItem._id} className="mt-2 p-2 bg-muted rounded-lg">
                            <p className="text-sm">Match Score: {(match.similarity * 100).toFixed(0)}%</p>
                            <p className="text-sm">Found at: {match.foundItem.placeFound}</p>
                              {item.status === 'active' && match.foundItem.status === 'active' ? (
                                <Button 
                                  onClick={() => handleClaim(
                                    item._id, 
                                    match.foundItem._id, 
                                    match.foundItem.verificationQuestion
                                  )}
                                  className="mt-2"
                                >
                                  Claim This Item
                                </Button>
                              ) : (
                                <p className="text-xs text-muted-foreground mt-2">Claim unavailable</p>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="found" className="space-y-4">
            {foundItems.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-muted rounded-full">
                      <Eye className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No found items yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't reported any found items. Help someone find their lost item!
                  </p>
                  <Button onClick={() => navigate('/')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Report Found Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {foundItems.map((item) => (
                  <Card key={item._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{item.itemName}</CardTitle>
                          <CardDescription>{item.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.status)}
                          {item.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item._id, 'found')}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Found on {formatDate(item.dateFound)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{item.placeFound}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{item.category}</span>
                        </div>
                        {item.brand && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{item.brand}</span>
                          </div>
                        )}
                      </div>
                      {item.storageLocation && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Storage Location:</p>
                          <p className="text-sm">{item.storageLocation}</p>
                        </div>
                      )}
                      {item.status === 'active' && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-2 text-blue-700">
                            <Clock className="h-4 w-4" />
                            <p className="text-sm font-medium">Waiting for Claims</p>
                          </div>
                          <p className="text-sm text-blue-600 mt-1">
                            This item requires verification for claiming
                          </p>
                        </div>
                      )}
                      {item.status === 'claimed' && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            <p className="text-sm font-medium">Item Claimed</p>
                          </div>
                          <p className="text-sm text-green-600 mt-1">
                            This item has been successfully claimed
                          </p>
                        </div>
                      )}
                      {item.status === 'claimed' && item.claimedCounterpart && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Contact Information:</p>
                          <p className="text-sm">Name: {item.claimedCounterpart.name} ({item.claimedCounterpart.studentId})</p>
                          <p className="text-sm">Mailid: {item.claimedCounterpart.email}</p>
                          {item.claimedCounterpart.phone && <p className="text-sm">Phone: {item.claimedCounterpart.phone}</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default Dashboard
