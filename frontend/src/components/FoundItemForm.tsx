import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Eye, MapPin, Calendar, Package, CheckCircle2, Loader2, Image as ImageIcon, X } from "lucide-react"

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
    contactPhone: ""
  })
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('submitting')

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login to report a found item",
          variant: "destructive"
        })
        setIsSubmitting(false)
        setSubmitStatus('idle')
        return
      }

      // Convert image to base64 if selected
      let imageUrl = null;
      if (imageFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert image to base64'));
            }
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(imageFile);
        imageUrl = await base64Promise;
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
          contactInfo: { phone: formData.contactPhone },
          verificationQuestion: formData.verificationQuestion,
          correctAnswer: formData.correctAnswer,
          imageUrl: imageUrl
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
        const newItem = response.data.data
        
        // OPTIMISTIC UPDATE: Add to cache immediately
        const cachedData = sessionStorage.getItem('dashboard_data')
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData)
            // Add new found item to cache
            parsed.foundItems = [...(parsed.foundItems || []), newItem]
            sessionStorage.setItem('dashboard_data', JSON.stringify(parsed))
            sessionStorage.setItem('dashboard_timestamp', Date.now().toString())
          } catch (e) {
            console.error('Error updating cache:', e)
          }
        }
        
        // Show success message
        setSubmitStatus('success')
        toast({
          title: "Your report has been submitted successfully! ",
          description: "Redirecting to dashboard...",
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
          contactPhone: ""
        })
        setImagePreview(null)
        setImageFile(null)
        
        // Clear cache flag to force refresh when dashboard loads
        sessionStorage.setItem('dashboard_needs_refresh', 'true')
        
        // Navigate immediately after short delay to show success message
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
          // Trigger dashboard refresh event
          window.dispatchEvent(new CustomEvent('dashboard-refresh'))
        }, 800)
      }
    } catch (error: any) {
      console.error('Submission error:', error.response?.data || error.message);
      setSubmitStatus('idle')
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
              <Label htmlFor="color">Color</Label>
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
              <Label htmlFor="brand">Brand</Label>
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
            <Label htmlFor="contactPhone">Your Phone Number *</Label>
            <Input
              id="contactPhone"
              placeholder="e.g., 9834****** - for the owner to contact you"
              value={formData.contactPhone}
              required
              pattern="\d{7,15}"
              onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Item Image (Optional)
            </Label>
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
                  </div>
                  <Input
                    id="image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast({
                            title: "File too large",
                            description: "Image must be less than 5MB",
                            variant: "destructive"
                          });
                          return;
                        }
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            )}
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
            disabled={isSubmitting || submitStatus === 'success'}
          >
            {submitStatus === 'success' ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submitted! Redirecting...
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reporting...
              </>
            ) : (
              "Report Found Item"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}