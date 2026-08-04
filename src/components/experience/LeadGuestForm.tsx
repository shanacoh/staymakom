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

/** Liste de pays proposée pour la nationalité du voyageur. Le code est au format ISO
 *  (2 lettres) attendu par HyperGuest. */
export const COUNTRY_OPTIONS: { code: string; name: string }[] = [
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
    nationality: "Nationality",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    optional: "optional",
    autoFilled: "Auto-filled from your account",
    required: "Required",
    invalidEmail: "Invalid email",
    invalidPhone: "Use international format, e.g. +972 XX XXX XXXX",
    phonePlaceholder: "+972 XX XXX XXXX",
    streetAddress: "Address",
    selectCountry: "Select a country",
  },
  he: {
    title: "פרטי האורח",
    nationality: "אזרחות",
    firstName: "שם פרטי",
    lastName: "שם משפחה",
    email: "אימייל",
    phone: "טלפון",
    optional: "לא חובה",
    autoFilled: "מילוי אוטומטי מהחשבון שלך",
    required: "שדה חובה",
    invalidEmail: "כתובת אימייל לא תקינה",
    invalidPhone: "השתמש בפורמט בינלאומי, לדוג׳ XXXX XXX XX 972+",
    phonePlaceholder: "+972 XX XXX XXXX",
    streetAddress: "כתובת",
    selectCountry: "בחר מדינה",
  },
  fr: {
    title: "Informations voyageur",
    nationality: "Nationalité",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    phone: "Téléphone",
    optional: "facultatif",
    autoFilled: "Pré-rempli depuis votre compte",
    required: "Requis",
    invalidEmail: "Email invalide",
    invalidPhone: "Format international, ex : +972 XX XXX XXXX",
    phonePlaceholder: "+972 XX XXX XXXX",
    streetAddress: "Adresse",
    selectCountry: "Choisir un pays",
  },
};

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isValidPhone(p: string): boolean {
  return /^\+?\d[\d\s-]{7,}$/.test(p.trim());
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

  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  // Field-level errors
  const errors = useMemo(() => {
    const show = showErrors;
    return {
      country: (show || touched.country) && !value.country.trim() ? t.required : null,
      firstName: (show || touched.firstName) && !value.firstName.trim() ? t.required : null,
      lastName: (show || touched.lastName) && !value.lastName.trim() ? t.required : null,
      address: (show || touched.address) && !value.address.trim() ? t.required : null,
      email: (show || touched.email) && !value.email.trim() ? t.required 
           : (show || touched.email) && !isValidEmail(value.email) ? t.invalidEmail : null,
      phone: (show || touched.phone) && value.phone.trim() && !isValidPhone(value.phone) ? t.invalidPhone : null,
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
        .select("first_name, last_name, phone, address_country")
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
        birthDate: "",
        address: "",
        city: "",
        postcode: "",
        country: customer?.address_country || "",
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
        <div className="space-y-1">
          <Label className="text-xs">{t.nationality} *</Label>
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
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError msg={errors.country} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        </div>

        <div className="space-y-1">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
            <Label className="text-xs">{t.phone} <span className="text-muted-foreground">({t.optional})</span></Label>
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
            />
            <FieldError msg={errors.phone} />
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
  country: "",
};

/** Source unique de vérité pour savoir si le voyageur a rempli les infos client.
 *  L'adresse de facturation reste collectée par le widget Revolut. */
export function isLeadGuestComplete(g: LeadGuestData): boolean {
  return (
    g.country.trim() !== "" &&
    g.firstName.trim() !== "" &&
    g.lastName.trim() !== "" &&
    g.address.trim() !== "" &&
    isValidEmail(g.email) &&
    (!g.phone.trim() || isValidPhone(g.phone))
  );
}

/** Sanitize lead guest data before sending to HyperGuest — ensures all formats are correct */
export function sanitizeLeadGuest(g: LeadGuestData): LeadGuestData & { title: "MR" | "MS" | "MRS" } {
  const phone = normalizePhone(g.phone);
  return {
    ...g,
    title: (g.title || "MR") as "MR" | "MS" | "MRS",
    firstName: g.firstName.trim(),
    lastName: g.lastName.trim(),
    email: g.email.trim().toLowerCase(),
    phone: phone || "+0000000000",
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(g.birthDate) ? g.birthDate : "1990-01-01",
    address: g.address?.trim() || "N/A",
    city: g.city?.trim() || "N/A",
    postcode: g.postcode?.trim() || "00000",
    country: g.country?.trim().toUpperCase() || "FR",
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
          address_country: guest.country.trim().toUpperCase() || undefined,
        });
    }
  } catch (err) {
    console.error("Failed to save profile fields:", err);
  }
}
