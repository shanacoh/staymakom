/**
 * Lead Guest Form — Collects guest info required by HyperGuest create-booking
 * Auto-fills from user profile
 */

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface LeadGuestData {
  title: "MR" | "MS" | "MRS" | "";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
}

/** Liste de pays proposée pour l'adresse de facturation. Le code est au format ISO
 *  (2 lettres) attendu par Revolut ; le libellé est affiché au client. */
export const BILLING_COUNTRIES: { code: string; name: string }[] = [
  { code: "IL", name: "Israël / Israel" },
  { code: "FR", name: "France" },
  { code: "US", name: "États-Unis / United States" },
  { code: "GB", name: "Royaume-Uni / United Kingdom" },
  { code: "BE", name: "Belgique / Belgium" },
  { code: "CH", name: "Suisse / Switzerland" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Allemagne / Germany" },
  { code: "ES", name: "Espagne / Spain" },
  { code: "IT", name: "Italie / Italy" },
  { code: "NL", name: "Pays-Bas / Netherlands" },
  { code: "PT", name: "Portugal" },
  { code: "LU", name: "Luxembourg" },
  { code: "AT", name: "Autriche / Austria" },
  { code: "AU", name: "Australie / Australia" },
  { code: "AE", name: "Émirats arabes unis / UAE" },
  { code: "MA", name: "Maroc / Morocco" },
  { code: "MX", name: "Mexique / Mexico" },
  { code: "BR", name: "Brésil / Brazil" },
  { code: "ZA", name: "Afrique du Sud / South Africa" },
];

interface LeadGuestFormProps {
  value: LeadGuestData;
  onChange: (data: LeadGuestData) => void;
  lang?: "en" | "he" | "fr";
  showErrors?: boolean;
  /** Called when CONTINUE is clicked — saves modified fields to profile */
  onSaveProfile?: boolean;
}

const translations = {
  en: {
    title: "Guest Information",
    titleField: "Title",
    titleMr: "Mr",
    titleMs: "Ms",
    titleMrs: "Mrs",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    birthDate: "Date of birth",
    autoFilled: "Auto-filled from your account",
    required: "Required",
    invalidEmail: "Invalid email",
    invalidPhone: "Use international format, e.g. +972 XX XXX XXXX",
    invalidBirthDate: "Enter a valid date of birth",
    phonePlaceholder: "+972 XX XXX XXXX",
    billingTitle: "Billing address",
    billingHint: "Required by your bank to process the card payment. All fields are mandatory.",
    streetAddress: "Street address",
    city: "City",
    postcode: "Postcode / ZIP",
    country: "Country",
    selectCountry: "Select a country",
    selectTitle: "Select",
  },
  he: {
    title: "פרטי האורח",
    titleField: "תואר",
    titleMr: "מר",
    titleMs: "גב׳",
    titleMrs: "גברת",
    firstName: "שם פרטי",
    lastName: "שם משפחה",
    email: "אימייל",
    phone: "טלפון",
    birthDate: "תאריך לידה",
    autoFilled: "מילוי אוטומטי מהחשבון שלך",
    required: "שדה חובה",
    invalidEmail: "כתובת אימייל לא תקינה",
    invalidPhone: "השתמש בפורמט בינלאומי, לדוג׳ XXXX XXX XX 972+",
    invalidBirthDate: "הזן תאריך לידה תקין",
    phonePlaceholder: "+972 XX XXX XXXX",
    billingTitle: "כתובת לחיוב",
    billingHint: "נדרש על ידי הבנק שלך כדי לעבד את תשלום הכרטיס. כל השדות חובה.",
    streetAddress: "כתובת",
    city: "עיר",
    postcode: "מיקוד",
    country: "מדינה",
    selectCountry: "בחר מדינה",
    selectTitle: "בחר",
  },
  fr: {
    title: "Informations voyageur",
    titleField: "Civilité",
    titleMr: "M.",
    titleMs: "Mlle",
    titleMrs: "Mme",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    phone: "Téléphone",
    birthDate: "Date de naissance",
    autoFilled: "Pré-rempli depuis votre compte",
    required: "Requis",
    invalidEmail: "Email invalide",
    invalidPhone: "Format international, ex : +972 XX XXX XXXX",
    invalidBirthDate: "Date de naissance invalide",
    phonePlaceholder: "+972 XX XXX XXXX",
    billingTitle: "Adresse de facturation",
    billingHint: "Demandée par votre banque pour valider le paiement par carte. Tous les champs sont obligatoires.",
    streetAddress: "Adresse (rue et numéro)",
    city: "Ville",
    postcode: "Code postal",
    country: "Pays",
    selectCountry: "Choisir un pays",
    selectTitle: "Choisir",
  },
};

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isValidPhone(p: string): boolean {
  return /^\+?\d[\d\s-]{7,}$/.test(p.trim());
}

function isValidBirthDate(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.trim())) return false;
  const [year, month, day] = d.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  return (
    year >= 1900 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= today.getTime()
  );
}

/** Normalize phone: strip spaces/dashes, ensure starts with + */
function normalizePhone(p: string): string {
  let cleaned = p.replace(/[\s\-()]/g, "");
  if (cleaned && !cleaned.startsWith("+") && cleaned.length >= 8) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
}

const inputStyle = {
  backgroundColor: '#F5F0E8',
  border: '1px solid #E8E0D4',
  borderRadius: '0px',
};

export function LeadGuestForm({ value, onChange, lang = "en", showErrors = false }: LeadGuestFormProps) {
  const t = translations[lang];
  const { user } = useAuth();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const maxBirthDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  // Field-level errors
  const errors = useMemo(() => {
    const show = showErrors;
    return {
      title: (show || touched.title) && !value.title.trim() ? t.required : null,
      firstName: (show || touched.firstName) && !value.firstName.trim() ? t.required : null,
      lastName: (show || touched.lastName) && !value.lastName.trim() ? t.required : null,
      email: (show || touched.email) && !value.email.trim() ? t.required 
           : (show || touched.email) && !isValidEmail(value.email) ? t.invalidEmail : null,
      phone: (show || touched.phone) && !value.phone.trim() ? t.required
           : (show || touched.phone) && !isValidPhone(value.phone) ? t.invalidPhone : null,
      birthDate: (show || touched.birthDate) && !value.birthDate.trim() ? t.required
           : (show || touched.birthDate) && !isValidBirthDate(value.birthDate) ? t.invalidBirthDate : null,
      address: (show || touched.address) && !value.address.trim() ? t.required : null,
      city: (show || touched.city) && !value.city.trim() ? t.required : null,
      postcode: (show || touched.postcode) && !value.postcode.trim() ? t.required : null,
      country: (show || touched.country) && !value.country.trim() ? t.required : null,
    };
  }, [value, touched, showErrors, t]);

  // Auto-fill from user profile on mount
  useEffect(() => {
    if (!user || profileLoaded) return;

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, phone")
        .eq("user_id", user.id)
        .single();

      const { data: customer } = await supabase
        .from("customers")
        .select("first_name, last_name, phone, birthdate, city, address_country")
        .eq("user_id", user.id)
        .single();

      const displayName = profile?.display_name || user.user_metadata?.display_name || "";
      const nameParts = displayName.split(" ");

      const profileData: LeadGuestData = {
        title: "",
        firstName: customer?.first_name || nameParts[0] || user.user_metadata?.first_name || "",
        lastName: customer?.last_name || nameParts.slice(1).join(" ") || user.user_metadata?.last_name || "",
        email: user.email || "",
        phone: normalizePhone(customer?.phone || profile?.phone || user.user_metadata?.phone || ""),
        birthDate: customer?.birthdate || "",
        address: "",
        city: customer?.city || "",
        postcode: "",
        country: customer?.address_country || "FR",
      };

      onChange(profileData);
      setProfileLoaded(true);
    };

    loadProfile();
  }, [user, profileLoaded]);

  const update = (field: keyof LeadGuestData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  const FieldError = ({ msg }: { msg: string | null }) => {
    if (!msg) return null;
    return (
      <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        {msg}
      </p>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          {t.title}
        </CardTitle>
        {user && profileLoaded && (
          <p className="text-xs text-muted-foreground mt-1">{t.autoFilled}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">{t.titleField} *</Label>
            <Select
              value={value.title || undefined}
              onValueChange={(v) => { update("title", v); markTouched("title"); }}
            >
              <SelectTrigger
                className={`h-9 ${errors.title ? "border-destructive" : ""}`}
                style={inputStyle}
              >
                <SelectValue placeholder={t.selectTitle} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MR">{t.titleMr}</SelectItem>
                <SelectItem value="MS">{t.titleMs}</SelectItem>
                <SelectItem value="MRS">{t.titleMrs}</SelectItem>
              </SelectContent>
            </Select>
            <FieldError msg={errors.title} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t.firstName} *</Label>
            <Input
              value={value.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              onBlur={() => markTouched("firstName")}
              className={`h-9 ${errors.firstName ? "border-destructive" : ""}`}
              style={inputStyle}
              required
            />
            <FieldError msg={errors.firstName} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t.lastName} *</Label>
            <Input
              value={value.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              onBlur={() => markTouched("lastName")}
              className={`h-9 ${errors.lastName ? "border-destructive" : ""}`}
              style={inputStyle}
              required
            />
            <FieldError msg={errors.lastName} />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">{t.email} *</Label>
            <Input
              type="email"
              value={value.email}
              onChange={(e) => update("email", e.target.value)}
              onBlur={() => markTouched("email")}
              className={`h-9 ${errors.email ? "border-destructive" : ""}`}
              style={inputStyle}
              required
            />
            <FieldError msg={errors.email} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t.phone} *</Label>
            <Input
              type="tel"
              value={value.phone}
              onChange={(e) => update("phone", e.target.value)}
              onBlur={() => {
                markTouched("phone");
                const normalized = normalizePhone(value.phone);
                if (normalized !== value.phone) update("phone", normalized);
              }}
              className={`h-9 ${errors.phone ? "border-destructive" : ""}`}
              style={inputStyle}
              placeholder={t.phonePlaceholder}
              required
            />
            <FieldError msg={errors.phone} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t.birthDate} *</Label>
            <Input
              type="date"
              value={value.birthDate}
              onChange={(e) => update("birthDate", e.target.value)}
              onBlur={() => markTouched("birthDate")}
              className={`h-9 ${errors.birthDate ? "border-destructive" : ""}`}
              style={inputStyle}
              max={maxBirthDate}
              required
            />
            <FieldError msg={errors.birthDate} />
          </div>
        </div>

        {/* Adresse de facturation complète, validée avant d'ouvrir le paiement Revolut. */}
        <div className="pt-2 mt-1 border-t">
          <p className="text-xs font-semibold text-foreground">{t.billingTitle}</p>
          <p className="text-[11px] text-muted-foreground mb-2">{t.billingHint}</p>

          <div className="space-y-1 mb-2">
            <Label className="text-xs">{t.streetAddress} *</Label>
            <Input
              value={value.address}
              onChange={(e) => update("address", e.target.value)}
              onBlur={() => markTouched("address")}
              className={`h-9 ${errors.address ? "border-destructive" : ""}`}
              style={inputStyle}
              required
            />
            <FieldError msg={errors.address} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{t.country} *</Label>
              <Select
                value={value.country || undefined}
                onValueChange={(v) => { update("country", v); markTouched("country"); }}
              >
                <SelectTrigger
                  className={`h-9 ${errors.country ? "border-destructive" : ""}`}
                  style={inputStyle}
                >
                  <SelectValue placeholder={t.selectCountry} />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError msg={errors.country} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.city} *</Label>
              <Input
                value={value.city}
                onChange={(e) => update("city", e.target.value)}
                onBlur={() => markTouched("city")}
                className={`h-9 ${errors.city ? "border-destructive" : ""}`}
                style={inputStyle}
                required
              />
              <FieldError msg={errors.city} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.postcode} *</Label>
              <Input
                value={value.postcode}
                onChange={(e) => update("postcode", e.target.value)}
                onBlur={() => markTouched("postcode")}
                className={`h-9 ${errors.postcode ? "border-destructive" : ""}`}
                style={inputStyle}
                required
              />
              <FieldError msg={errors.postcode} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const EMPTY_LEAD_GUEST: LeadGuestData = {
  title: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  address: "",
  city: "",
  postcode: "",
  country: "IL",
};

/** Source unique de vérité pour savoir si le voyageur a rempli tout ce qu'il faut,
 *  y compris l'adresse de facturation requise par Revolut. Utilisée par les deux
 *  parcours (hôtel et expérience "only") pour ne jamais ouvrir le paiement sans
 *  adresse complète. */
export function isLeadGuestComplete(g: LeadGuestData): boolean {
  return (
    g.title.trim() !== "" &&
    g.firstName.trim() !== "" &&
    g.lastName.trim() !== "" &&
    isValidEmail(g.email) &&
    isValidPhone(g.phone) &&
    isValidBirthDate(g.birthDate) &&
    g.address.trim() !== "" &&
    g.city.trim() !== "" &&
    g.postcode.trim() !== "" &&
    g.country.trim() !== ""
  );
}

/** Construit l'adresse de facturation au format attendu par le widget Revolut
 *  (@revolut/checkout). countryCode doit être un code ISO 2 lettres. */
export function buildRevolutBillingAddress(g: LeadGuestData): {
  countryCode: string;
  postcode: string;
  city?: string;
  streetLine1?: string;
} {
  return {
    countryCode: g.country.trim().toUpperCase(),
    postcode: g.postcode.trim(),
    city: g.city.trim() || undefined,
    streetLine1: g.address.trim() || undefined,
  };
}

/** Sanitize lead guest data before sending to HyperGuest — ensures all formats are correct */
export function sanitizeLeadGuest(g: LeadGuestData): LeadGuestData & { title: "MR" | "MS" | "MRS" } {
  let birthDate = g.birthDate;
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    birthDate = "1990-01-01"; // Safe fallback
  }
  return {
    ...g,
    title: (g.title || "MR") as "MR" | "MS" | "MRS",
    firstName: g.firstName.trim(),
    lastName: g.lastName.trim(),
    email: g.email.trim().toLowerCase(),
    phone: normalizePhone(g.phone),
    birthDate,
    address: g.address?.trim() || "N/A",
    city: g.city?.trim() || "N/A",
    postcode: g.postcode?.trim() || "",
    country: g.country?.trim().toUpperCase() || "IL",
  };
}

/** Save modified profile fields back to Supabase */
export async function saveProfileFields(userId: string, guest: LeadGuestData) {
  try {
    const normalizedPhone = normalizePhone(guest.phone);

    // Update user_profiles
    await supabase
      .from("user_profiles")
      .update({
        phone: normalizedPhone || undefined,
      })
      .eq("user_id", userId);

    // Update or create customer record
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      await supabase
        .from("customers")
        .update({
          first_name: guest.firstName.trim(),
          last_name: guest.lastName.trim(),
          phone: normalizedPhone || undefined,
          birthdate: isValidBirthDate(guest.birthDate) ? guest.birthDate : undefined,
          city: guest.city.trim() || undefined,
          address_country: guest.country.trim().toUpperCase() || undefined,
        })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("customers")
        .insert({
          user_id: userId,
          first_name: guest.firstName.trim(),
          last_name: guest.lastName.trim(),
          phone: normalizedPhone || undefined,
          birthdate: isValidBirthDate(guest.birthDate) ? guest.birthDate : undefined,
          city: guest.city.trim() || undefined,
          address_country: guest.country.trim().toUpperCase() || undefined,
        });
    }
  } catch (err) {
    console.error("Failed to save profile fields:", err);
  }
}
