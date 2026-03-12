/**
 * Lead Guest Form — Collects guest info required by HyperGuest create-booking
 * Auto-fills from user profile, with option to book for someone else
 */

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { User, Gift, AlertCircle } from "lucide-react";
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
  country: string;
}

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
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    bookForOther: "Book for someone else",
    bookForOtherDesc: "Fill in the guest's details below",
    autoFilled: "Auto-filled from your account",
    required: "Required",
    invalidEmail: "Invalid email",
    invalidPhone: "Use international format, e.g. +972 XX XXX XXXX",
    phonePlaceholder: "+972 XX XXX XXXX",
  },
  he: {
    title: "פרטי האורח",
    firstName: "שם פרטי",
    lastName: "שם משפחה",
    email: "אימייל",
    phone: "טלפון",
    bookForOther: "הזמנה עבור מישהו אחר",
    bookForOtherDesc: "מלא את פרטי האורח למטה",
    autoFilled: "מילוי אוטומטי מהחשבון שלך",
    required: "שדה חובה",
    invalidEmail: "כתובת אימייל לא תקינה",
    invalidPhone: "השתמש בפורמט בינלאומי, לדוג׳ XXXX XXX XX 972+",
    phonePlaceholder: "+972 XX XXX XXXX",
  },
  fr: {
    title: "Informations voyageur",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    phone: "Téléphone",
    bookForOther: "Réserver pour quelqu'un d'autre",
    bookForOtherDesc: "Remplissez les coordonnées du voyageur ci-dessous",
    autoFilled: "Pré-rempli depuis votre compte",
    required: "Requis",
    invalidEmail: "Email invalide",
    invalidPhone: "Format international, ex : +972 XX XXX XXXX",
    phonePlaceholder: "+972 XX XXX XXXX",
  },
};

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isValidPhone(p: string): boolean {
  return /^\+?\d[\d\s\-]{7,}$/.test(p.trim());
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
  const [isForOther, setIsForOther] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savedProfileData, setSavedProfileData] = useState<LeadGuestData | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  // Field-level errors
  const errors = useMemo(() => {
    const show = showErrors;
    return {
      firstName: (show || touched.firstName) && !value.firstName.trim() ? t.required : null,
      lastName: (show || touched.lastName) && !value.lastName.trim() ? t.required : null,
      email: (show || touched.email) && !value.email.trim() ? t.required 
           : (show || touched.email) && !isValidEmail(value.email) ? t.invalidEmail : null,
      phone: (show || touched.phone) && !value.phone.trim() ? t.required 
           : (show || touched.phone) && !isValidPhone(value.phone) ? t.invalidPhone : null,
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
        birthDate: "",
        address: "",
        city: customer?.city || "",
        country: customer?.address_country || "IL",
      };

      setSavedProfileData(profileData);
      onChange(profileData);
      setProfileLoaded(true);
    };

    loadProfile();
  }, [user, profileLoaded]);

  const handleToggleForOther = (forOther: boolean) => {
    setIsForOther(forOther);
    setTouched({});
    if (!forOther && savedProfileData) {
      onChange(savedProfileData);
    } else if (forOther) {
      onChange({ ...EMPTY_LEAD_GUEST, country: savedProfileData?.country || "IL" });
    }
  };

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
        {user && !isForOther && profileLoaded && (
          <p className="text-xs text-muted-foreground mt-1">{t.autoFilled}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Toggle: book for someone else */}
        {user && (
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{t.bookForOther}</p>
                {isForOther && (
                  <p className="text-xs text-muted-foreground">{t.bookForOtherDesc}</p>
                )}
              </div>
            </div>
            <Switch checked={isForOther} onCheckedChange={handleToggleForOther} />
          </div>
        )}

        {/* Name */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">{t.firstName} *</Label>
            <Input
              value={value.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              onBlur={() => markTouched("firstName")}
              className={`h-9 ${errors.firstName ? "border-destructive" : ""}`}
              style={inputStyle}
              required
              readOnly={!isForOther && profileLoaded && !!value.firstName}
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
              readOnly={!isForOther && profileLoaded && !!value.lastName}
            />
            <FieldError msg={errors.lastName} />
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-2">
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
              readOnly={!isForOther && profileLoaded && !!value.email}
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
  country: "IL",
};

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
    country: g.country?.trim().toUpperCase() || "IL",
  };
}

/** Save modified profile fields back to Supabase */
export async function saveProfileFields(userId: string, guest: LeadGuestData) {
  try {
    // Update user_profiles
    await supabase
      .from("user_profiles")
      .update({
        phone: guest.phone || undefined,
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
          first_name: guest.firstName,
          last_name: guest.lastName,
          phone: guest.phone || undefined,
        })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("customers")
        .insert({
          user_id: userId,
          first_name: guest.firstName,
          last_name: guest.lastName,
          phone: guest.phone || undefined,
        });
    }
  } catch (err) {
    console.error("Failed to save profile fields:", err);
  }
}
