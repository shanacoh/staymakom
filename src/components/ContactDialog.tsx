import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  "Active",
  "Family", 
  "Golden Age",
  "Nature",
  "Romantic",
  "Taste",
];

const ContactDialog = ({ open, onOpenChange }: ContactDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");
  const { toast } = useToast();

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      if (prev.length >= 3) {
        toast({
          title: "Maximum reached",
          description: "You can select up to 3 categories",
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, category];
    });
  };

  const handleOtherToggle = (checked: boolean) => {
    setShowOtherInput(checked);
    if (checked) {
      if (selectedCategories.length >= 3) {
        toast({
          title: "Maximum reached",
          description: "You can select up to 3 categories",
          variant: "destructive",
        });
        return;
      }
      setSelectedCategories(prev => [...prev, "Other"]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== "Other"));
      setOtherText("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const interests = [...selectedCategories];
    if (showOtherInput && otherText) {
      interests[interests.indexOf("Other")] = `Other: ${otherText}`;
    }

    try {
      const { error } = await supabase
        .from("leads")
        .insert({
          source: "win_trip",
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          phone: formData.get("phone") as string || null,
          interests: interests,
        });

      if (error) throw error;

      toast({
        title: "Registration submitted!",
        description: "We'll contact you soon about your chance to win.",
      });
      onOpenChange(false);
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Win Your Next Trip</DialogTitle>
          <DialogDescription>
            Register for a chance to win an extraordinary experience in Israel
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" required placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required placeholder="your@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="space-y-3">
            <Label>What type of escape interests you the most? (Max 3)</Label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <label
                    htmlFor={category}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
              <div className="flex items-center space-x-2 col-span-2">
                <Checkbox
                  id="autres"
                  checked={showOtherInput}
                  onCheckedChange={handleOtherToggle}
                />
                <label
                  htmlFor="autres"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Other
                </label>
              </div>
              {showOtherInput && (
                <div className="col-span-2">
                  <Input
                    placeholder="Please specify..."
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Registration"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
