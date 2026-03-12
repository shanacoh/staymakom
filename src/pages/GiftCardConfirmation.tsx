import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function GiftCardConfirmation() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const [copied, setCopied] = useState(false);

  const { data: giftCard, isLoading } = useQuery({
    queryKey: ["gift-card", code],
    queryFn: async () => {
      if (!code) throw new Error("No gift card code provided");
      
      // For now, we'll just return the code since we can't query the gift_cards table directly
      // In production, this would be handled by an edge function
      return {
        code,
        type,
      };
    },
    enabled: !!code,
  });

  const copyToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Gift code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="font-sans text-3xl font-bold mb-4">Gift card not found</h1>
          <p className="text-muted-foreground mb-8">The gift card code could not be found.</p>
          <Button asChild>
            <Link to="/gift-card">Create a Gift Card</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-sans text-4xl md:text-5xl font-bold">
            Your Staymakom Gift Card has been sent!
          </h1>
          <p className="text-xl text-muted-foreground">
            {type === "amount" 
              ? "The recipient will receive an email with their gift card and instructions to redeem it."
              : "The recipient will receive an email with their curated experience and booking details."}
          </p>
        </div>

        <Card className="shadow-medium mb-8">
          <CardHeader className="text-center">
            <CardTitle>Gift Card Details</CardTitle>
            <CardDescription>Share this code with the recipient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-6 text-center space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Gift Card Code
              </p>
              <p className="font-mono text-2xl md:text-3xl font-bold text-primary break-all">
                {code}
              </p>
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="w-full sm:w-auto"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Email Confirmation Sent</p>
                  <p className="text-sm text-muted-foreground">
                    Both you and the recipient will receive email confirmations with all the details.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Valid for 12 Months</p>
                  <p className="text-sm text-muted-foreground">
                    The gift card can be redeemed anytime within the next year.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-muted/30 rounded-lg p-8 text-center space-y-4">
          <h3 className="font-sans text-xl font-semibold">What happens next?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The recipient will receive an email with their unique gift code and instructions on how to redeem it. 
            They can browse all available experiences and book their perfect stay whenever they're ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild variant="outline">
              <Link to="/">Back to Home</Link>
            </Button>
            <Button asChild>
              <Link to="/gift-card">Send Another Gift</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
