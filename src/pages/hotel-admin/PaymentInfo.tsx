import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Building, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PaymentInfo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: hotelAdmin, isLoading } = useQuery({
    queryKey: ["hotel-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_admins")
        .select("*, hotels(*)")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const hotel = hotelAdmin?.hotels;

  // Form state for payout information
  const [formData, setFormData] = useState({
    billing_email: "",
    company_name: "",
    vat_number: "",
    iban: "",
    swift_bic: "",
    bank_name: "",
    account_holder_name: "",
  });

  // Load existing data from hotel metadata or future payout table
  useEffect(() => {
    if (hotel) {
      // For now, we'll store in contact_email until we add dedicated payout fields
      setFormData({
        billing_email: hotel.contact_email || user?.email || "",
        company_name: hotel.name || "",
        vat_number: "",
        iban: "",
        swift_bic: "",
        bank_name: "",
        account_holder_name: "",
      });
    }
  }, [hotel, user]);

  // Save mutation (for now just updates contact_email, will be extended with migration)
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!hotel?.id) throw new Error("Hotel ID not found");

      const { error } = await supabase
        .from("hotels")
        .update({
          contact_email: formData.billing_email,
        })
        .eq("id", hotel.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment information saved");
      queryClient.invalidateQueries({ queryKey: ["hotel-admin", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save payment information");
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No hotel found for your account</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-sans text-4xl font-bold">Payment Information</h1>
        <p className="text-muted-foreground mt-2">
          Manage your payout details for receiving payments
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          This information will be used for processing payouts to your account. 
          Stripe Connect integration will be configured here in a future update.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billing_email">Billing Email *</Label>
              <Input 
                id="billing_email"
                type="email"
                value={formData.billing_email}
                onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                placeholder="billing@hotel.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company / Hotel Name *</Label>
              <Input 
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Hotel Name Ltd."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vat_number">VAT / Tax Number</Label>
              <Input 
                id="vat_number"
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                placeholder="IL123456789"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account_holder_name">Account Holder Name *</Label>
              <Input 
                id="account_holder_name"
                value={formData.account_holder_name}
                onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                placeholder="Legal name on bank account"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input 
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="Bank Hapoalim"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN *</Label>
                <Input 
                  id="iban"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  placeholder="IL00 0000 0000 0000 0000 000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="swift_bic">SWIFT / BIC Code</Label>
                <Input 
                  id="swift_bic"
                  value={formData.swift_bic}
                  onChange={(e) => setFormData({ ...formData, swift_bic: e.target.value })}
                  placeholder="POALILIT"
                />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your banking information is securely stored and will only be used for processing payouts.
                STAYMAKOM Admin will verify this information before activating payouts.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Stripe Connect Placeholder */}
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center space-y-3">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="font-semibold">Stripe Connect</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Automatic payout integration via Stripe Connect will be available soon. 
                This will enable instant payouts directly to your bank account.
              </p>
              <Button variant="outline" disabled>
                Connect with Stripe (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            size="lg"
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Payment Information
          </Button>
        </div>
      </div>
    </div>
  );
}
