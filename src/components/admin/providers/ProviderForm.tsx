import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  PROVIDER_BOOKING_CHANNEL_OPTIONS,
  PROVIDER_LANGUAGE_OPTIONS,
  PROVIDER_STATUS_OPTIONS,
  PROVIDER_TYPE_OPTIONS,
  type LinkedHotel,
  type Provider,
  type ProviderDraft,
  type ProviderLanguage,
  type ProviderStatus,
  type ProviderType,
} from "@/lib/providers/types";
import { cn } from "@/lib/utils";
import { RegionSelect } from "@/components/forms/shared/RegionSelect";

const NONE = "none";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function LanguageSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string | null;
  onChange: (value: ProviderLanguage | null) => void;
}) {
  // Une langue saisie autrefois en texte libre reste affichée tant qu'on ne la remplace pas.
  const legacy = value && !PROVIDER_LANGUAGE_OPTIONS.some((o) => o.value === value) ? value : null;
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : (v as ProviderLanguage))}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Non précisée</SelectItem>
        {legacy && <SelectItem value={legacy}>{legacy}</SelectItem>}
        {PROVIDER_LANGUAGE_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface ProviderFormProps {
  draft: ProviderDraft;
  onChange: (patch: Partial<ProviderDraft>) => void;
  /** Le prestataire enregistré : sert aux informations en lecture seule (conditions partenaires). */
  provider: Provider;
  /** Ses hôtels, pour rappeler leur taux de commission à côté du sien. */
  hotels: LinkedHotel[];
}

/** Tous les champs d'un prestataire, rangés par thème. Ne fait qu'afficher et remonter les changements. */
export function ProviderForm({ draft, onChange, provider, hotels }: ProviderFormProps) {
  const text = (value: string) => value.trim() || null;
  const set =
    <K extends keyof ProviderDraft>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ [key]: text(e.target.value) } as Partial<ProviderDraft>);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Identité">
        <Field label="Nom *" htmlFor="provider-name">
          <Input id="provider-name" value={draft.name} onChange={(e) => onChange({ name: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type" htmlFor="provider-type">
            <Select value={draft.provider_type} onValueChange={(v) => onChange({ provider_type: v as ProviderType })}>
              <SelectTrigger id="provider-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Statut" htmlFor="provider-status">
            <Select value={draft.status} onValueChange={(v) => onChange({ status: v as ProviderStatus })}>
              <SelectTrigger id="provider-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Région" htmlFor="provider-region">
            <RegionSelect id="provider-region" value={draft.region_id} onChange={(region_id) => onChange({ region_id })} />
          </Field>
          <Field label="Langue de communication" htmlFor="provider-language">
            <LanguageSelect id="provider-language" value={draft.language} onChange={(language) => onChange({ language })} />
          </Field>
        </div>
        <Field label="Adresse" htmlFor="provider-address">
          <Input id="provider-address" defaultValue={draft.address ?? ""} onChange={set("address")} />
        </Field>
      </Section>

      <Section title="Contact principal">
        <Field label="Nom" htmlFor="provider-contact-name">
          <Input id="provider-contact-name" defaultValue={draft.contact_name ?? ""} onChange={set("contact_name")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="WhatsApp" htmlFor="provider-whatsapp">
            <Input id="provider-whatsapp" type="tel" placeholder="+972…" defaultValue={draft.whatsapp ?? ""} onChange={set("whatsapp")} />
          </Field>
          <Field label="Email" htmlFor="provider-email">
            <Input id="provider-email" type="email" defaultValue={draft.email ?? ""} onChange={set("email")} />
          </Field>
        </div>
      </Section>

      <Section
        title="Contact du jour J par défaut"
        description="Envoyé au client dans la confirmation et le rappel de la veille, quand l'expérience n'a pas son propre contact. Celui de l'expérience reste prioritaire."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Nom" htmlFor="provider-day-name">
            <Input id="provider-day-name" defaultValue={draft.day_contact_name ?? ""} onChange={set("day_contact_name")} />
          </Field>
          <Field label="WhatsApp" htmlFor="provider-day-whatsapp">
            <Input
              id="provider-day-whatsapp"
              type="tel"
              placeholder="+972…"
              defaultValue={draft.day_contact_whatsapp ?? ""}
              onChange={set("day_contact_whatsapp")}
            />
          </Field>
          <Field label="Langue parlée" htmlFor="provider-day-language">
            <LanguageSelect
              id="provider-day-language"
              value={draft.day_contact_language}
              onChange={(day_contact_language) => onChange({ day_contact_language })}
            />
          </Field>
        </div>
      </Section>

      <Section title="Commission et réservation">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Commission (%)" htmlFor="provider-commission" hint="Vide tant qu'elle n'est pas convenue.">
            <Input
              id="provider-commission"
              type="number"
              min={0}
              max={100}
              step="0.5"
              defaultValue={draft.commission_percent ?? ""}
              onChange={(e) => onChange({ commission_percent: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </Field>
          {hotels.length > 0 && (
            <Field label="Commission notée sur ses hôtels" hint="Lecture seule. Se modifie sur la fiche de l'hôtel, rien n'est recalculé ici.">
              <ul className="space-y-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
                {hotels.map((h) => (
                  <li key={h.id} className="flex justify-between gap-3">
                    <span className="truncate">{h.name}</span>
                    <span className="tabular-nums">{h.commissionRate == null ? "à compléter" : `${h.commissionRate} %`}</span>
                  </li>
                ))}
              </ul>
            </Field>
          )}
        </div>
        <Field label="Canal de réservation par défaut" hint="Celui choisi sur l'expérience reste prioritaire.">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Canal de réservation par défaut">
            {PROVIDER_BOOKING_CHANNEL_OPTIONS.map((o) => {
              const active = draft.booking_channel === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={o.comingSoon}
                  title={o.comingSoon ? "À venir" : undefined}
                  onClick={() => onChange({ booking_channel: active ? null : o.value })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active ? "border-black bg-black text-white" : "border-border hover:bg-muted",
                    o.comingSoon && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                >
                  {o.label}
                  {o.comingSoon && " · à venir"}
                </button>
              );
            })}
          </div>
        </Field>
        {draft.booking_channel === "provider_website" && (
          <Field label="Lien du site de réservation" htmlFor="provider-booking-url">
            <Input id="provider-booking-url" type="url" placeholder="https://…" defaultValue={draft.booking_url ?? ""} onChange={set("booking_url")} />
          </Field>
        )}
      </Section>

      <Section title="Conditions d'annulation et météo">
        <Field label="Conditions" htmlFor="provider-conditions">
          <Textarea id="provider-conditions" rows={3} defaultValue={draft.conditions ?? ""} onChange={set("conditions")} />
        </Field>
        <Field label="Politique annulation / météo" htmlFor="provider-policy">
          <Textarea
            id="provider-policy"
            rows={3}
            placeholder="Annulation gratuite jusqu'à 72h avant, ensuite non remboursable. Mer agitée : le skipper décide, client choisit report ou remboursement intégral."
            defaultValue={draft.cancellation_weather_policy ?? ""}
            onChange={set("cancellation_weather_policy")}
          />
        </Field>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div>
            <Label htmlFor="provider-policy-validated" className="text-sm">
              Conditions validées par le prestataire
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tant que ce n'est pas coché, le badge rouge s'affiche partout où ce prestataire apparaît.
            </p>
          </div>
          <Switch
            id="provider-policy-validated"
            checked={draft.policy_validated}
            onCheckedChange={(policy_validated) => onChange({ policy_validated })}
          />
        </div>
      </Section>

      <Section title="Facturation" description="Pas de coordonnées bancaires ici.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Raison sociale" htmlFor="provider-legal-name">
            <Input id="provider-legal-name" defaultValue={draft.legal_name ?? ""} onChange={set("legal_name")} />
          </Field>
          <Field label="Numéro fiscal" htmlFor="provider-tax-id">
            <Input id="provider-tax-id" defaultValue={draft.tax_id ?? ""} onChange={set("tax_id")} />
          </Field>
        </div>
        <Field label="Conditions partenaires" hint="Rempli automatiquement quand le prestataire les acceptera dans son espace partenaire.">
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
            {provider.terms_accepted_at
              ? `Acceptées le ${format(parseISO(provider.terms_accepted_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}${
                  provider.terms_version ? ` · version ${provider.terms_version}` : ""
                }`
              : "Pas encore acceptées"}
          </p>
        </Field>
      </Section>

      <Section title="Suivi interne">
        <Field label="Identifiant du contact CRM" htmlFor="provider-crm" hint="Pour relier plus tard cette fiche au CRM.">
          <Input id="provider-crm" defaultValue={draft.crm_contact_id ?? ""} onChange={set("crm_contact_id")} />
        </Field>
        <Field label="Notes internes" htmlFor="provider-notes">
          <Textarea id="provider-notes" rows={4} defaultValue={draft.internal_notes ?? ""} onChange={set("internal_notes")} />
        </Field>
      </Section>
    </div>
  );
}
