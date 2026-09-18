import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Mail, CheckCircle2, XCircle } from "lucide-react";

const EMAIL_FUNCTIONS = [
  { id: "send-contact-request", label: "Contact Request", body: (email: string) => ({ name: "Test Admin", email, message: "Test email from admin panel", lang: "en" }) },
  { id: "send-booking-confirmation", label: "Booking Confirmation", body: (email: string) => ({ to: email, guestName: "Test Guest", hotelName: "Hotel Test", experienceTitle: "Test Experience", checkIn: "2026-04-10", checkOut: "2026-04-12", totalPrice: 1500, currency: "ILS", bookingRef: "SM-TEST-001", lang: "en" }) },
  { id: "send-gift-card", label: "Gift Card", body: (email: string) => ({ recipientEmail: email, recipientName: "Test", senderName: "Admin", amount: 500, currency: "ILS", code: "MK-TEST-0000", message: "Test gift card", lang: "en" }) },
  { id: "send-partner-request", label: "Partner Request", body: (email: string) => ({ name: "Test Hotel", email, phone: "+972500000000", hotelName: "Test Property", message: "Test partner request", lang: "en" }) },
  { id: "send-corporate-request", label: "Corporate Request", body: (email: string) => ({ name: "Test Corp", email, company: "Test Inc.", message: "Test corporate request", lang: "en" }) },
];

function EmailTestCard() {
  const [testEmail, setTestEmail] = useState("");
  const [selectedFn, setSelectedFn] = useState(EMAIL_FUNCTIONS[0].id);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTest = async () => {
    if (!testEmail) { toast.error("Enter an email address"); return; }
    setSending(true);
    setLastResult(null);
    const fn = EMAIL_FUNCTIONS.find((f) => f.id === selectedFn)!;
    try {
      const { data, error } = await supabase.functions.invoke(fn.id, { body: fn.body(testEmail) });
      if (error) throw error;
      setLastResult({ ok: true, message: `${fn.label} sent to ${testEmail}` });
      toast.success(`Email sent!`);
    } catch (err: any) {
      setLastResult({ ok: false, message: err.message || "Failed to send" });
      toast.error(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          Test d'email
        </CardTitle>
        <CardDescription className="text-xs">Envoyer un email de test pour vérifier l'intégration Resend</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        <div className="space-y-2">
          <Label>Email destinataire</Label>
          <Input
            type="email"
            placeholder="vous@email.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Type d'email</Label>
          <Select value={selectedFn} onValueChange={setSelectedFn}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_FUNCTIONS.map((fn) => (
                <SelectItem key={fn.id} value={fn.id}>{fn.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleTest} disabled={sending || !testEmail} variant="outline">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
            Envoyer le test
          </Button>
          {lastResult && (
            <span className={`flex items-center gap-1.5 text-sm ${lastResult.ok ? "text-emerald-600" : "text-red-600"}`}>
              {lastResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {lastResult.message}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    site_name: "",
    site_tagline: "",
    contact_email: "",
    partners_email: "",
    instagram_handle: "",
    default_commission_rate: 18,
    default_currency: "USD",
    stripe_publishable_key: "",
    service_fee: 0,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["global-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .eq("key", "site_config")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        site_name: settings.site_name || "",
        site_tagline: settings.site_tagline || "",
        contact_email: settings.contact_email || "",
        partners_email: settings.partners_email || "",
        instagram_handle: settings.instagram_handle || "",
        default_commission_rate: settings.default_commission_rate || 18,
        default_currency: settings.default_currency || "USD",
        stripe_publishable_key: settings.stripe_publishable_key || "",
        service_fee: (settings as any).service_fee ?? 0,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (settings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from("global_settings")
          .update(data)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from("global_settings")
          .insert([{ key: "site_config", ...data }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-settings"] });
      toast.success("Settings saved successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Réglages</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Configuration générale du site</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Informations du site
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="site-name">Nom du site</Label>
              <Input
                id="site-name"
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-tagline">Accroche</Label>
              <Input
                id="site-tagline"
                value={formData.site_tagline}
                onChange={(e) => setFormData({ ...formData, site_tagline: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email général</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partners-email">Email partenaires</Label>
              <Input
                id="partners-email"
                type="email"
                value={formData.partners_email}
                onChange={(e) => setFormData({ ...formData, partners_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Compte Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram_handle}
                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Paramètres métier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="commission">Taux de commission par défaut (%)</Label>
              <Input
                id="commission"
                type="number"
                value={formData.default_commission_rate}
                onChange={(e) =>
                  setFormData({ ...formData, default_commission_rate: parseFloat(e.target.value) || 0 })
                }
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-fee">Frais de service Staymakom (₪)</Label>
              <Input
                id="service-fee"
                type="number"
                value={formData.service_fee}
                onChange={(e) =>
                  setFormData({ ...formData, service_fee: parseFloat(e.target.value) || 0 })
                }
                step="1"
              />
              <p className="text-xs text-muted-foreground">
                Frais fixe en ₪ ajouté à chaque réservation comme ligne séparée au paiement.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Devise par défaut</Label>
              <Input
                id="currency"
                value={formData.default_currency}
                onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="stripe-key">Clé publique Stripe</Label>
              <Input
                id="stripe-key"
                placeholder="pk_..."
                value={formData.stripe_publishable_key}
                onChange={(e) => setFormData({ ...formData, stripe_publishable_key: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Les clés publiques (pk_...) peuvent être utilisées sans risque côté client.
              </p>
            </div>
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Les clés secrètes Stripe doivent être stockées comme secrets backend pour des raisons de sécurité.
                Contacter l'administrateur pour configurer STRIPE_SECRET_KEY dans l'environnement backend.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <EmailTestCard />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
