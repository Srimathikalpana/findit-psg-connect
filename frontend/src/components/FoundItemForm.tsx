import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Eye, MapPin, Calendar, Package } from "lucide-react"

const locations = [
  "Library",
  "Cafeteria", 
  "Hostel",
  "Academic Block A",
  "Academic Block B",
  "Academic Block C",
  "Sports Complex",
  "Auditorium",
  "Parking Area",
  "Computer Center",
  "Other"
]

const categories = [
  "Electronics",
  "Clothing",
  "Accessories",
  "Books",
  "Stationery",
  "Sports Equipment",
  "Personal Items",
  "Other"
]

export const FoundItemForm = () => {
  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    dateFound: "",
    placeFound: "",
    category: "",
    color: "",
    brand: "",
    storageLocation: "",
    verificationQuestion: "",
    correctAnswer: "",
    contactInfo: ""
  })
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      console.log('Submitting found item with token:', token?.substring(0, 20) + '...');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login to report a found item",
          variant: "destructive"
        })
        return
      }

      const response = await axios.post(
        'http://localhost:8080/api/found-items',
        {
          itemName: formData.itemName,
          description: formData.description,
          placeFound: formData.placeFound,
          dateFound: formData.dateFound,
          category: formData.category,
          color: formData.color,
          brand: formData.brand,
          storageLocation: formData.storageLocation,
          contactInfo: formData.contactInfo,
          verificationQuestion: formData.verificationQuestion,
          correctAnswer: formData.correctAnswer
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      )

      if (response.data.success) {
        toast({
          title: "Found item reported successfully!",
          description: "We'll check for potential matches and notify the owner if found.",
        })

        // Show matches if any
        if (response.data.matches && response.data.matches.length > 0) {
          toast({
            title: "Potential matches found!",
            description: `Found ${response.data.matches.length} potential matches. Check your dashboard for details.`,
          })
        }

        // Reset form
        setFormData({
          itemName: "",
          description: "",
          dateFound: "",
          placeFound: "",
          category: "",
          color: "",
          brand: "",
          storageLocation: "",
          verificationQuestion: "",
          correctAnswer: "",
          contactInfo: ""
        })
      }
    } catch (error: any) {
      console.error('Submission error:', error.response?.data || error.message);
      toast({
        title: "Error reporting found item",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-success/10 rounded-full">
            <Eye className="h-6 w-6 text-success" />
          </div>
        </div>
        <CardTitle>Report a Found Item</CardTitle>
        <CardDescription>
          Help someone recover their lost item by reporting what you found
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="itemName" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Item Name *
            </Label>
            <Input
              id="itemName"
              placeholder="e.g., iPhone 13, Blue Backpack, Red Jacket"
              value={formData.itemName}
              onChange={(e) => setFormData({...formData, itemName: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the item in detail (color, brand, distinctive features, condition, etc.)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFound" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Found *
              </Label>
              <Input
                id="dateFound"
                type="date"
                value={formData.dateFound}
                onChange={(e) => setFormData({...formData, dateFound: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Found *
              </Label>
              <Select onValueChange={(value) => setFormData({...formData, placeFound: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Where did you find it?" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color (Optional)</Label>
              <Input
                id="color"
                placeholder="e.g., Blue, Red, Black"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand (Optional)</Label>
              <Input
                id="brand"
                placeholder="e.g., Apple, Nike, Samsung"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storageLocation">Current Storage Location</Label>
              <Input
                id="storageLocation"
                placeholder="e.g., Security Office, Lost & Found"
                value={formData.storageLocation}
                onChange={(e) => setFormData({...formData, storageLocation: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Your Contact Information (Optional)</Label>
            <Input
              id="contactInfo"
              placeholder="Your phone number or email for the owner to contact you"
              value={formData.contactInfo}
              onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
            />
          </div>
          <div className="space-y-6 border-t pt-6">
            <h3 className="font-medium text-lg">Verification Details</h3>
            <div className="space-y-2">
              <Label htmlFor="verificationQuestion">
                Verification Question *
                <span className="text-sm text-muted-foreground block">
                  This will be asked to anyone claiming to have found your item
                </span>
              </Label>
              <Input
                id="verificationQuestion"
                placeholder="e.g., What's unique about this item? Any identifying marks?"
                value={formData.verificationQuestion}
                onChange={(e) => setFormData({...formData, verificationQuestion: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correctAnswer">
                Correct Answer *
                <span className="text-sm text-muted-foreground block">
                  The expected answer from the true owner
                </span>
              </Label>
              <Input
                id="correctAnswer"
                placeholder="e.g., Initials 'JD', Pattern is L shape"
                value={formData.correctAnswer}
                onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                required
              />
            </div>
          </div>
          <Button 
            type="submit" 
            variant="default" 
            className="w-full bg-green-600 hover:bg-green-700" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Reporting..." : "Report Found Item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}