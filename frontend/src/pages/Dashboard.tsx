import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
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

    let mounted = true

    const loadData = async () => {
      // Check if dashboard needs refresh (after form submission)
      const needsRefresh = sessionStorage.getItem('dashboard_needs_refresh') === 'true'
      if (needsRefresh) {
        sessionStorage.removeItem('dashboard_needs_refresh')
        // Force fresh fetch
        sessionStorage.removeItem('dashboard_data')
        sessionStorage.removeItem('dashboard_timestamp')
      }

      // Check sessionStorage cache first
      const cachedData = sessionStorage.getItem('dashboard_data')
      const cacheTimestamp = sessionStorage.getItem('dashboard_timestamp')
      const cacheExpiry = 5 * 60 * 1000 // 5 minutes

      if (cachedData && cacheTimestamp && !needsRefresh) {
        const age = Date.now() - parseInt(cacheTimestamp)
        if (age < cacheExpiry) {
          try {
            const parsed = JSON.parse(cachedData)
            if (mounted) {
              setUser(parsed.user)
              setLostItems(parsed.lostItems || [])
              setFoundItems(parsed.foundItems || [])
              setLoading(false) // Show content immediately
            }
            // Fetch fresh data in background (non-blocking)
            Promise.all([fetchUserData(), fetchUserItems()]).catch(() => {})
            return
          } catch (e) {
            console.error('Error parsing cached data:', e)
          }
        }
      }

      // Fetch fresh data in parallel
      try {
        await Promise.all([fetchUserData(), fetchUserItems()])
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      }
    }

    loadData()

    // Listen for refresh event from form submissions
    const handleRefresh = () => {
      if (mounted) {
        // Force refresh by clearing cache and reloading
        sessionStorage.removeItem('dashboard_data')
        sessionStorage.removeItem('dashboard_timestamp')
        loadData()
      }
    }

    window.addEventListener('dashboard-refresh', handleRefresh)

    return () => {
      mounted = false
      window.removeEventListener('dashboard-refresh', handleRefresh)
    }
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
        const userData = response.data.data
        setUser(userData)
        
        // Update cache with new user data
        const cachedData = sessionStorage.getItem('dashboard_data')
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData)
            parsed.user = userData
            sessionStorage.setItem('dashboard_data', JSON.stringify(parsed))
          } catch (e) {
            console.error('Error updating user in cache:', e)
          }
        }
        
        return userData
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        sessionStorage.removeItem('dashboard_data')
        sessionStorage.removeItem('dashboard_timestamp')
        navigate('/login')
      }
      throw error
    }
  }

  const fetchUserItems = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch items first (without matches for faster initial load)
      const itemsResponse = await axios.get('http://localhost:8080/api/my-items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (itemsResponse.data.success) {
        const lostItems = itemsResponse.data.data.lostItems || []
        const foundItems = itemsResponse.data.data.foundItems || []

        // Update items immediately (without matches)
        setLostItems(lostItems)
        setFoundItems(foundItems)
        setLoading(false) // Show content immediately
        
        // Update cache immediately (without matches for speed)
        const cacheData = {
          user: user || null,
          lostItems: lostItems,
          foundItems: foundItems
        }
        sessionStorage.setItem('dashboard_data', JSON.stringify(cacheData))
        sessionStorage.setItem('dashboard_timestamp', Date.now().toString())

        // Fetch matches in background (non-blocking, lazy loading)
        if (lostItems.length > 0) {
          // Use setTimeout to not block UI rendering
          setTimeout(() => {
            Promise.all(
              lostItems.map(async (item: LostItem) => {
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
            ).then(lostItemsWithMatches => {
              // Update with matches when ready
              setLostItems(lostItemsWithMatches)
              
              // Update cache with matches
              const updatedCacheData = {
                user: user || null,
                lostItems: lostItemsWithMatches,
                foundItems: foundItems
              }
              sessionStorage.setItem('dashboard_data', JSON.stringify(updatedCacheData))
              sessionStorage.setItem('dashboard_timestamp', Date.now().toString())
            }).catch(err => {
              console.error('Error loading matches:', err)
            })
          }, 100) // Small delay to let UI render first
        }
        
        return { lostItems, foundItems }
      }
    } catch (error: any) {
      console.error('Error fetching user items:', error)
      if (error.response?.status === 401) {
        sessionStorage.removeItem('dashboard_data')
        sessionStorage.removeItem('dashboard_timestamp')
      }
      toast({
        title: "Error loading items",
        description: "Failed to load your items. Please try again.",
        variant: "destructive"
      })
      throw error
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
        const finderContactInfo = response.data.data?.finderContactInfo
        
        // Show success message with confirmation
        toast({ 
          title: 'Answer verified successfully! ✅', 
          description: finderContactInfo ? "Here's the finder's contact information." : 'Verification passed. Items marked as claimed.' 
        })
        
        // INSTANT UPDATE: Optimistically update status AND contact info immediately
        setLostItems(prev => prev.map(li => {
          if (li._id === lostItemId) {
            const updated = { ...li, status: 'claimed' as const }
            // Add contact info instantly if available
            if (finderContactInfo) {
              updated.claimedCounterpart = {
                name: finderContactInfo.name,
                email: finderContactInfo.email,
                studentId: finderContactInfo.studentId,
                phone: finderContactInfo.phone
              }
            }
            return updated
          }
          return li
        }))
        
        setFoundItems(prev => prev.map(fi => fi._id === foundItemId ? { ...fi, status: 'claimed' as const } : fi))
        
        // Update cache with new contact info immediately
        const cachedData = sessionStorage.getItem('dashboard_data')
        if (cachedData && finderContactInfo) {
          try {
            const parsed = JSON.parse(cachedData)
            parsed.lostItems = parsed.lostItems.map((li: LostItem) => {
              if (li._id === lostItemId) {
                return {
                  ...li,
                  status: 'claimed',
                  claimedCounterpart: {
                    name: finderContactInfo.name,
                    email: finderContactInfo.email,
                    studentId: finderContactInfo.studentId,
                    phone: finderContactInfo.phone
                  }
                }
              }
              return li
            })
            sessionStorage.setItem('dashboard_data', JSON.stringify(parsed))
            sessionStorage.setItem('dashboard_timestamp', Date.now().toString())
          } catch (e) {
            console.error('Error updating cache with contact info:', e)
          }
        }
        
        // Refresh items in background to ensure data consistency
        // This runs in the background without blocking the UI
        fetchUserItems().catch(err => {
          console.error('Error refreshing items after claim:', err)
          // Contact info is already displayed from the response, so this is just for consistency
        })
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

  // Memoize filtered and sorted items for performance
  const activeLostItems = useMemo(() => 
    lostItems.filter(item => item.status === 'active'),
    [lostItems]
  )
  
  const claimedLostItems = useMemo(() => 
    lostItems.filter(item => item.status === 'claimed'),
    [lostItems]
  )

  const activeFoundItems = useMemo(() => 
    foundItems.filter(item => item.status === 'active'),
    [foundItems]
  )

  const claimedFoundItems = useMemo(() => 
    foundItems.filter(item => item.status === 'claimed'),
    [foundItems]
  )

  // Memoize sorted matches
  const sortedPotentialMatches = useMemo(() => {
    return (item: LostItem) => {
      if (!item.potentialMatches) return []
      return [...item.potentialMatches].sort((a, b) => b.similarity - a.similarity)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header />
        <div className="container py-16 space-y-8">
          {/* Welcome Section Skeleton */}
          <div className="text-center space-y-4">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Items Skeleton */}
          <Tabs defaultValue="lost" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lost"><Skeleton className="h-4 w-24" /></TabsTrigger>
              <TabsTrigger value="found"><Skeleton className="h-4 w-24" /></TabsTrigger>
            </TabsList>
            <TabsContent value="lost" className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
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
            onClick={() => navigate('/report')}
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
                    You haven't reported any lost items.
                  </p>
                  
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
                        {sortedPotentialMatches(item).map(match => (
                          <div key={match.foundItem._id} className="mt-2 p-2 bg-muted rounded-lg">
                            <p className="text-sm">Match Score: {(match.similarity * 100).toFixed(0)}%</p>
                            <p className="text-sm">Found at: {match.foundItem.placeFound}</p>
                            {match.foundItem.description && (
                              <p className="text-sm text-muted-foreground mt-1">Description: {match.foundItem.description}</p>
                            )}
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
                    You haven't reported any found items.
                  </p>
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
