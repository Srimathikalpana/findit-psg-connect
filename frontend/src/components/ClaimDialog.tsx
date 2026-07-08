import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { API } from '@/lib/api'

interface ClaimDialogProps {
  itemId: string
  question: string
  onClaimSubmit: () => void
}

export function ClaimDialog({ itemId, question, onClaimSubmit }: ClaimDialogProps) {
  const [answer, setAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  // imported API constant from '@/lib/api'

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      // Normalize the answer by converting to lowercase and removing extra spaces
      const normalizedAnswer = answer.toLowerCase().trim()
      
      const response = await axios.post(
        `${API}/api/claims/verify/${itemId}`,
        { 
          answer: normalizedAnswer,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        toast({
          title: "Claim Successful!",
          description: "Your answer was correct. The item has been marked as claimed.",
        })
        setIsOpen(false)
        onClaimSubmit()
      } else {
        toast({
          title: "Incorrect Answer",
          description: "Please try again with a different answer.",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit claim",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Claim Item</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Verify Ownership</DialogTitle>
          <DialogDescription>
            Please answer the verification question to claim this item.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Verification Question:</Label>
            <p className="text-sm font-medium">{question}</p>
            <p className="text-xs text-muted-foreground">
              Please answer this question to verify your ownership of the item.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="answer">Your Answer</Label>
            <Input
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer"
              required
            />
            <p className="text-xs text-muted-foreground">
              Provide specific details to prove your ownership. Your answer will be matched against key details.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Submit Answer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}