import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Search, MapPin, Calendar, Package } from "lucide-react"

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

export const LostItemForm = () => {
  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    dateLost: "",
    location: "",
    contactInfo: ""
  })
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simulate form submission
    toast({
      title: "Lost item reported successfully!",
      description: "We'll notify you if someone finds your item.",
    })
    
    // Reset form
    setFormData({
      itemName: "",
      description: "",
      dateLost: "",
      location: "",
      contactInfo: ""
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-destructive/10 rounded-full">
            <Search className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <CardTitle>Report Your Lost Item</CardTitle>
        <CardDescription>
          Fill out the details below and we'll help you find your lost item
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
              placeholder="e.g., iPhone 13, Blue Backpack"
              value={formData.itemName}
              onChange={(e) => setFormData({...formData, itemName: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your item in detail (color, brand, distinctive features, etc.)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateLost" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Lost *
              </Label>
              <Input
                id="dateLost"
                type="date"
                value={formData.dateLost}
                onChange={(e) => setFormData({...formData, dateLost: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location *
              </Label>
              <Select onValueChange={(value) => setFormData({...formData, location: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Where did you lose it?" />
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

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Information (Optional)</Label>
            <Input
              id="contactInfo"
              placeholder="Your phone number or additional contact details"
              value={formData.contactInfo}
              onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Report Lost Item
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}