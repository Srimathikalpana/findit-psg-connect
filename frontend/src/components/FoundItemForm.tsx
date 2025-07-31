import { useState } from "react"
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

export const FoundItemForm = () => {
  const [formData, setFormData] = useState({
    itemDescription: "",
    dateSeen: "",
    placeSeen: "",
    remarks: ""
  })
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simulate form submission
    toast({
      title: "Found item reported successfully!",
      description: "The owner will be notified about your discovery.",
    })
    
    // Reset form
    setFormData({
      itemDescription: "",
      dateSeen: "",
      placeSeen: "",
      remarks: ""
    })
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
            <Label htmlFor="itemDescription" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Item Description *
            </Label>
            <Textarea
              id="itemDescription"
              placeholder="Describe the item you found (color, brand, type, etc.)"
              value={formData.itemDescription}
              onChange={(e) => setFormData({...formData, itemDescription: e.target.value})}
              required
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateSeen" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Found *
              </Label>
              <Input
                id="dateSeen"
                type="date"
                value={formData.dateSeen}
                onChange={(e) => setFormData({...formData, dateSeen: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Found *
              </Label>
              <Select onValueChange={(value) => setFormData({...formData, placeSeen: value})}>
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

          <div className="space-y-2">
            <Label htmlFor="remarks">Additional Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Any additional details about where exactly you found it or its condition"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              rows={3}
            />
          </div>

          <Button type="submit" variant="success" className="w-full" size="lg">
            Report Found Item
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}