import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { format, differenceInCalendarDays } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CountrySelect } from "@/components/admin/CountrySelect";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ComingSoon from "./ComingSoon";

type ClientRow = {
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  phone: string;
  addressCountry: string;
  city: string;
  birthdate: string;
  defaultPartySize: number;
  notes: string;
  marketingOptIn: boolean;
  reservationsCount: number;
  lastActivity: Date;
};

type TeamRow = {
  roleId: string;
  user_id: string;
  role: "admin" | "hotel_admin";
  name: string;
  email: string;
  hotelId: string;
  hotelName: string | null;
  createdAt: string | null;
};

function formatRelativeDay(date: Date): string {
  const diffDays = differenceInCalendarDays(new Date(), date);
  if (diffDays <= 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  return `il y a ${diffDays} j`;
}

// ─── Fiche détail client (consultation + édition) ───
function ClientDetailSheet({
  client,
  onClose,
}: {
  client: ClientRow | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressCountry: "",
    city: "",
    birthdate: "",
    defaultPartySize: 2,
    notes: "",
    marketingOptIn: false,
  });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (client && loadedFor !== client.user_id) {
    setLoadedFor(client.user_id);
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      addressCountry: client.addressCountry,
      city: client.city,
      birthdate: client.birthdate,
      defaultPartySize: client.defaultPartySize,
      notes: client.notes,
      marketingOptIn: client.marketingOptIn,
    });
  }

  const { data: fullDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-client-full-detail", client?.user_id],
    queryFn: async () => {
      if (!client) return null;
      const email = client.email.toLowerCase();

      const [
        { data: hgBookings },
        { data: standaloneBookingsAll },
        { data: wishlistItems },
        { data: profile },
        { data: pointsHistory },
        { data: savedCarts },
      ] = await Promise.all([
        supabase
          .from("bookings_hg" as any)
          .select("id, created_at, checkin, sell_price, status, is_cancelled, hotels2(name)")
          .eq("user_id", client.user_id)
          .order("created_at", { ascending: false }) as any,
        supabase
          .from("standalone_bookings")
          .select(
            "id, created_at, booking_date, sell_price, status, is_cancelled, custom_experience_title, standalone_experience_id, customer_email, user_id, standalone_experiences(title)"
          ),
        supabase
          .from("wishlist")
          .select("id, experience_id, experience_type, created_at")
          .eq("user_id", client.user_id)
          .is("deleted_at", null),
        supabase.from("user_profiles").select("*").eq("user_id", client.user_id).maybeSingle(),
        supabase
          .from("loyalty_points")
          .select("id, action, points, description, created_at")
          .eq("user_id", client.user_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("saved_carts")
          .select("id, experience_id, checkin, checkout, party_size, notes, created_at, experiences2(title)")
          .eq("user_id", client.user_id)
          .order("created_at", { ascending: false }),
      ]);

      const standaloneBookings = (standaloneBookingsAll || []).filter(
        (b: any) => b.user_id === client.user_id || (b.customer_email || "").toLowerCase() === email
      );

      const reservations = [
        ...((hgBookings || []) as any[]).map((b) => ({
          id: b.id,
          date: b.checkin || b.created_at,
          title: b.hotels2?.name || "Hôtel",
          amount: b.sell_price,
          status: b.is_cancelled ? "cancelled" : b.status,
        })),
        ...standaloneBookings.map((b: any) => ({
          id: b.id,
          date: b.booking_date || b.created_at,
          title: b.standalone_experiences?.title || b.custom_experience_title || "Expérience",
          amount: b.sell_price,
          status: b.is_cancelled ? "cancelled" : b.status,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const byType: Record<string, string[]> = { experiences2: [], experiences: [], standalone: [] };
      (wishlistItems || []).forEach((w) => {
        if (byType[w.experience_type]) byType[w.experience_type].push(w.experience_id);
      });
      const [exp2Res, expRes, standaloneExpRes] = await Promise.all([
        byType.experiences2.length
          ? supabase.from("experiences2").select("id, title").in("id", byType.experiences2)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        byType.experiences.length
          ? (supabase as any).from("experiences").select("id, title").in("id", byType.experiences)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        byType.standalone.length
          ? (supabase as any).from("standalone_experiences").select("id, title").in("id", byType.standalone)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);
      const titleMap = new Map<string, string>();
      (exp2Res.data || []).forEach((e: any) => titleMap.set(`experiences2:${e.id}`, e.title));
      (expRes.data || []).forEach((e: any) => titleMap.set(`experiences:${e.id}`, e.title));
      (standaloneExpRes.data || []).forEach((e: any) => titleMap.set(`standalone:${e.id}`, e.title));

      const favorites = (wishlistItems || []).map((w) => ({
        id: w.id,
        title: titleMap.get(`${w.experience_type}:${w.experience_id}`) || "Titre inconnu",
        createdAt: w.created_at,
      }));

      return {
        reservations,
        favorites,
        club: {
          loyaltyTier: profile?.loyalty_tier || null,
          points: profile?.total_points || 0,
          progress: profile?.membership_progress || 0,
        },
        pointsHistory: pointsHistory || [],
        savedCarts: (savedCarts || []).map((c: any) => ({
          id: c.id,
          title: c.experiences2?.title || "Expérience",
          checkin: c.checkin,
          checkout: c.checkout,
          partySize: c.party_size,
          notes: c.notes,
          createdAt: c.created_at,
        })),
        profile: {
          locale: profile?.locale || null,
          interests: profile?.interests || [],
          referralSource: profile?.referral_source || null,
          tosAcceptedAt: profile?.tos_accepted_at || null,
          gdprConsentAt: profile?.gdpr_consent_at || null,
          onboardingCompletedAt: profile?.onboarding_completed_at || null,
        },
      };
    },
    enabled: !!client,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!client) return;
      const [{ error: customerError }, { error: profileError }] = await Promise.all([
        supabase
          .from("customers")
          .update({
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone || null,
            address_country: form.addressCountry || null,
            city: form.city || null,
            birthdate: form.birthdate || null,
            default_party_size: form.defaultPartySize,
            notes: form.notes || null,
          })
          .eq("user_id", client.user_id),
        supabase
          .from("user_profiles")
          .update({ marketing_opt_in: form.marketingOptIn })
          .eq("user_id", client.user_id),
      ]);
      if (customerError) throw customerError;
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts-clients"] });
      toast.success("Fiche client mise à jour");
      onClose();
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  return (
    <Sheet open={!!client} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {client && (
          <div className="space-y-5 mt-2">
            <SheetHeader>
              <SheetTitle>{client.firstName} {client.lastName}</SheetTitle>
            </SheetHeader>

            <div className="text-sm text-muted-foreground space-y-1">
              <div>{client.email}</div>
              <div className="text-xs">
                Inscrit le {format(new Date(client.createdAt), "dd/MM/yyyy")} · {client.reservationsCount} réservation
                {client.reservationsCount > 1 ? "s" : ""} · dernière activité {formatRelativeDay(client.lastActivity)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="client-first-name">Prénom</Label>
                <Input
                  id="client-first-name"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client-last-name">Nom</Label>
                <Input
                  id="client-last-name"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="client-phone">Téléphone</Label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pays</Label>
                <CountrySelect
                  value={form.addressCountry}
                  onChange={(v) => setForm((f) => ({ ...f, addressCountry: v }))}
                  placeholder="Sélectionner un pays"
                />
              </div>
              <div>
                <Label htmlFor="client-city">Ville</Label>
                <Input
                  id="client-city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="client-birthdate">Date de naissance</Label>
                <Input
                  id="client-birthdate"
                  type="date"
                  value={form.birthdate}
                  onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client-party-size">Taille de groupe par défaut</Label>
                <Input
                  id="client-party-size"
                  type="number"
                  min={1}
                  value={form.defaultPartySize}
                  onChange={(e) => setForm((f) => ({ ...f, defaultPartySize: Number(e.target.value) || 1 }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="client-marketing" className="text-sm">
                Opt-in marketing
              </Label>
              <Switch
                id="client-marketing"
                checked={form.marketingOptIn}
                onCheckedChange={(v) => setForm((f) => ({ ...f, marketingOptIn: v }))}
              />
            </div>

            <div>
              <Label htmlFor="client-notes">Notes internes</Label>
              <Textarea
                id="client-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={4}
                className="mt-1"
              />
            </div>

            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>

            <div className="border-t pt-4 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                  Réservations
                </div>
                {detailLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : fullDetail && fullDetail.reservations.length > 0 ? (
                  <div className="space-y-2">
                    {fullDetail.reservations.map((r) => (
                      <div key={r.id} className="border rounded-md p-2.5 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{r.title}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(r.date), "dd/MM/yy")}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">{r.status || "—"}</span>
                          <span className="text-xs font-medium">₪{Number(r.amount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucune réservation</p>
                )}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                  Favoris
                </div>
                {detailLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : fullDetail && fullDetail.favorites.length > 0 ? (
                  <ul className="space-y-1">
                    {fullDetail.favorites.map((f) => (
                      <li key={f.id} className="text-sm border rounded-md p-2">
                        {f.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucun favori</p>
                )}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                  Club fidélité
                </div>
                {detailLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : fullDetail?.club.loyaltyTier || fullDetail?.club.points || fullDetail?.club.progress ? (
                  <div className="border rounded-md p-2.5 text-sm space-y-0.5">
                    <div>Palier : <span className="font-medium capitalize">{fullDetail.club.loyaltyTier || "—"}</span></div>
                    <div>Points : <span className="font-medium">{fullDetail.club.points}</span></div>
                    <div>Progression : <span className="font-medium">{fullDetail.club.progress}</span></div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Programme fidélité pas encore activé pour ce client.</p>
                )}
                {fullDetail && fullDetail.pointsHistory.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {fullDetail.pointsHistory.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between text-xs border rounded-md p-2">
                        <span className="text-muted-foreground">
                          {p.description || p.action} · {format(new Date(p.created_at), "dd/MM/yy")}
                        </span>
                        <span className={cn("font-medium", p.points >= 0 ? "text-green-600" : "text-red-500")}>
                          {p.points >= 0 ? "+" : ""}{p.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                  Paniers sauvegardés
                </div>
                {detailLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : fullDetail && fullDetail.savedCarts.length > 0 ? (
                  <div className="space-y-2">
                    {fullDetail.savedCarts.map((c) => (
                      <div key={c.id} className="border rounded-md p-2.5 text-sm">
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {c.checkin ? format(new Date(c.checkin), "dd/MM/yy") : "—"}
                          {c.checkout ? ` → ${format(new Date(c.checkout), "dd/MM/yy")}` : ""}
                          {c.partySize ? ` · ${c.partySize} pers.` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucun panier sauvegardé</p>
                )}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                  Informations complémentaires
                </div>
                {detailLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : (
                  <div className="border rounded-md p-2.5 text-sm space-y-0.5">
                    <div>Langue : <span className="font-medium uppercase">{fullDetail?.profile.locale || "—"}</span></div>
                    <div>
                      Centres d'intérêt :{" "}
                      <span className="font-medium">
                        {fullDetail?.profile.interests?.length ? fullDetail.profile.interests.join(", ") : "—"}
                      </span>
                    </div>
                    <div>Source d'acquisition : <span className="font-medium">{fullDetail?.profile.referralSource || "—"}</span></div>
                    <div>
                      CGU acceptées le :{" "}
                      <span className="font-medium">
                        {fullDetail?.profile.tosAcceptedAt ? format(new Date(fullDetail.profile.tosAcceptedAt), "dd/MM/yyyy") : "—"}
                      </span>
                    </div>
                    <div>
                      Consentement RGPD :{" "}
                      <span className="font-medium">
                        {fullDetail?.profile.gdprConsentAt ? format(new Date(fullDetail.profile.gdprConsentAt), "dd/MM/yyyy") : "—"}
                      </span>
                    </div>
                    <div>
                      Onboarding terminé le :{" "}
                      <span className="font-medium">
                        {fullDetail?.profile.onboardingCompletedAt
                          ? format(new Date(fullDetail.profile.onboardingCompletedAt), "dd/MM/yyyy")
                          : "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Onglet Clients ───
function ClientsTab() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["admin-accounts-clients"],
    queryFn: async () => {
      const { data: base, error } = await supabase.rpc("get_customers_with_emails");
      if (error) throw error;
      if (!base) return [];

      const userIds = base.map((c) => c.user_id);

      const [{ data: customerExtra }, { data: profiles }, { data: roles }, { data: hgBookings }, { data: standaloneBookings }] =
        await Promise.all([
          supabase.from("customers").select("user_id, phone, city, birthdate, default_party_size").in("user_id", userIds),
          supabase.from("user_profiles").select("user_id, marketing_opt_in").in("user_id", userIds),
          supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
          supabase.from("bookings_hg" as any).select("user_id, created_at, is_cancelled").eq("is_cancelled", false) as any,
          supabase.from("standalone_bookings").select("user_id, customer_email, created_at, is_cancelled").eq("is_cancelled", false),
        ]);

      const extraMap = new Map((customerExtra || []).map((c) => [c.user_id, c]));
      const profilesMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      const rolesMap = new Map((roles || []).map((r) => [r.user_id, r.role]));

      const result: ClientRow[] = base
        .filter((c) => (rolesMap.get(c.user_id) || "customer") === "customer")
        .map((c) => {
          const email = (c.user_email || "").toLowerCase();
          const hgMatches = ((hgBookings || []) as any[]).filter((b) => b.user_id === c.user_id);
          const standaloneMatches = (standaloneBookings || []).filter(
            (b) => b.user_id === c.user_id || (b.customer_email || "").toLowerCase() === email
          );
          const bookingDates = [...hgMatches, ...standaloneMatches].map((b) => new Date(b.created_at));
          const lastActivity =
            bookingDates.length > 0
              ? new Date(Math.max(...bookingDates.map((d) => d.getTime())))
              : new Date(c.created_at);

          return {
            user_id: c.user_id,
            firstName: c.first_name || "",
            lastName: c.last_name || "",
            email: c.user_email,
            createdAt: c.created_at,
            phone: extraMap.get(c.user_id)?.phone || "",
            addressCountry: c.address_country || "",
            city: extraMap.get(c.user_id)?.city || "",
            birthdate: extraMap.get(c.user_id)?.birthdate || "",
            defaultPartySize: extraMap.get(c.user_id)?.default_party_size ?? 2,
            notes: c.notes || "",
            marketingOptIn: profilesMap.get(c.user_id)?.marketing_opt_in ?? false,
            reservationsCount: hgMatches.length + standaloneMatches.length,
            lastActivity,
          };
        });

      return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  });

  const list = clients ?? [];
  const selectedClient = list.find((c) => c.user_id === selectedClientId) || null;

  return (
    <>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Nom</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Email</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Inscrit le</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Opt-in marketing</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Résa</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Dernière activité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-sm">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                  Aucun client
                </TableCell>
              </TableRow>
            ) : (
              list.map((c) => (
                <TableRow
                  key={c.user_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedClientId(c.user_id)}
                >
                  <TableCell className="py-2 px-3 text-sm font-medium">
                    {c.firstName} {c.lastName}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                    {format(new Date(c.createdAt), "dd/MM")}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] font-semibold",
                        c.marketingOptIn ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {c.marketingOptIn ? "Oui" : "Non"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm font-medium">{c.reservationsCount}</TableCell>
                  <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                    {formatRelativeDay(c.lastActivity)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClientDetailSheet client={selectedClient} onClose={() => setSelectedClientId(null)} />
    </>
  );
}

// ─── Fiche détail équipe (consultation + édition) ───
function TeamDetailSheet({
  member,
  hotels,
  onClose,
  onSaveRole,
  onDelete,
}: {
  member: TeamRow | null;
  hotels: { id: string; name: string }[] | undefined;
  onClose: () => void;
  onSaveRole: (userId: string, roleId: string, role: "admin" | "hotel_admin", hotelId: string) => void;
  onDelete: (userId: string, email: string) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", role: "admin" as "admin" | "hotel_admin", hotelId: "" });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (member && loadedFor !== member.user_id) {
    setLoadedFor(member.user_id);
    setForm({ name: member.name, role: member.role, hotelId: member.hotelId });
  }

  const saveNameMutation = useMutation({
    mutationFn: async () => {
      if (!member) return;
      const { error } = await supabase
        .from("user_profiles")
        .update({ display_name: form.name })
        .eq("user_id", member.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts-team"] });
      toast.success("Fiche mise à jour");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  return (
    <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {member && (
          <div className="space-y-5 mt-2">
            <SheetHeader>
              <SheetTitle>{member.name || "—"}</SheetTitle>
            </SheetHeader>

            <div className="text-sm text-muted-foreground">{member.email}</div>

            <div>
              <Label htmlFor="team-detail-name">Nom complet</Label>
              <Input
                id="team-detail-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => saveNameMutation.mutate()} disabled={saveNameMutation.isPending}>
              {saveNameMutation.isPending ? "Enregistrement..." : "Enregistrer le nom"}
            </Button>

            <div>
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as typeof f.role }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hotel_admin">Hotel admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.role === "hotel_admin" && (
              <div>
                <Label>Hôtel</Label>
                <Select value={form.hotelId} onValueChange={(v) => setForm((f) => ({ ...f, hotelId: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un hôtel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels?.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => onSaveRole(member.user_id, member.roleId, form.role, form.hotelId)}
            >
              Enregistrer le rôle
            </Button>

            <button
              className="text-sm text-destructive hover:underline"
              onClick={() => onDelete(member.user_id, member.email)}
            >
              Supprimer cet accès
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Onglet Équipe (accès) ───
const emptyTeamForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: "admin" as "admin" | "hotel_admin",
  hotelId: "",
};

function TeamTab({ dialogOpen, setDialogOpen }: { dialogOpen: boolean; setDialogOpen: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyTeamForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; email: string } | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const { data: hotels } = useQuery({
    queryKey: ["all-hotels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: team, isLoading } = useQuery({
    queryKey: ["admin-accounts-team"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .in("role", ["admin", "hotel_admin"]);
      if (error) throw error;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);

      const [{ data: memberRows }, { data: hotelAdmins }] = await Promise.all([
        supabase.rpc("get_team_members_with_emails"),
        supabase.from("hotel_admins").select("user_id, hotel_id, hotels(name)").in("user_id", userIds),
      ]);

      const memberMap = new Map((memberRows || []).map((m) => [m.user_id, m]));
      const haMap = new Map((hotelAdmins || []).map((h) => [h.user_id, h]));

      const result: TeamRow[] = roles.map((r) => {
        const m = memberMap.get(r.user_id);
        const ha = haMap.get(r.user_id) as any;
        return {
          roleId: r.id,
          user_id: r.user_id,
          role: r.role as "admin" | "hotel_admin",
          name: m?.display_name || "—",
          email: m?.user_email || "—",
          hotelId: ha?.hotel_id || "",
          hotelName: ha?.hotels?.name || null,
          createdAt: m?.account_created_at || null,
        };
      });

      result.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return result;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.email.trim()) throw new Error("L'email est obligatoire.");
      if (!form.password.trim()) throw new Error("Le mot de passe est obligatoire.");
      if (!form.firstName.trim() || !form.lastName.trim()) throw new Error("Le prénom et le nom sont obligatoires.");
      if (form.role === "hotel_admin" && !form.hotelId) throw new Error("Sélectionne l'hôtel de cet accès.");

      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "create",
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          role: form.role,
          hotelId: form.role === "hotel_admin" ? form.hotelId : null,
        },
      });
      if (error) {
        if (error instanceof FunctionsHttpError) {
          const d = await error.context.json();
          throw new Error(d.error || "Erreur lors de la création.");
        }
        throw new Error(error.message || "Erreur lors de la création.");
      }
      if (data && !data.success) throw new Error(data.error || "Erreur lors de la création.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts-team"] });
      toast.success("Accès créé");
      setDialogOpen(false);
      setForm(emptyTeamForm);
      setFormError(null);
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({
      userId,
      roleId,
      newRole,
      hotelId,
    }: {
      userId: string;
      roleId: string;
      newRole: "admin" | "hotel_admin";
      hotelId?: string;
    }) => {
      await supabase.from("user_roles").delete().eq("id", roleId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) throw error;
      if (newRole === "hotel_admin" && hotelId) {
        const { data: existing } = await supabase.from("hotel_admins").select("user_id").eq("user_id", userId).maybeSingle();
        if (existing) {
          await supabase.from("hotel_admins").update({ hotel_id: hotelId }).eq("user_id", userId);
        } else {
          await supabase.from("hotel_admins").insert({ user_id: userId, hotel_id: hotelId });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts-team"] });
      toast.success("Rôle mis à jour");
      setSelectedMemberId(null);
    },
    onError: () => toast.error("Erreur lors de la mise à jour du rôle"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", userId },
      });
      if (error) {
        if (error instanceof FunctionsHttpError) {
          const d = await error.context.json();
          throw new Error(d.error || "Erreur lors de la suppression.");
        }
        throw new Error(error.message || "Erreur lors de la suppression.");
      }
      if (!data?.success) throw new Error(data?.error || "Erreur lors de la suppression.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts-team"] });
      toast.success("Accès supprimé");
      setDeleteTarget(null);
      setDeleteConfirmEmail("");
      setSelectedMemberId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const list = team ?? [];
  const selectedMember = list.find((m) => m.user_id === selectedMemberId) || null;

  return (
    <div className="space-y-3">
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Nom</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Email</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Rôle</TableHead>
              <TableHead className="h-8 w-[60px] px-3 text-[10px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-sm">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                  Aucun accès équipe
                </TableCell>
              </TableRow>
            ) : (
              list.map((member) => (
                <TableRow
                  key={member.roleId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedMemberId(member.user_id)}
                >
                  <TableCell className="py-2 px-3 text-sm font-medium">{member.name || "—"}</TableCell>
                  <TableCell className="py-2 px-3 text-sm text-muted-foreground">{member.email}</TableCell>
                  <TableCell className="py-2 px-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] font-semibold",
                        member.role === "admin" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {member.role === "admin" ? "Admin" : "Hotel admin"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ userId: member.user_id, email: member.email });
                        setDeleteConfirmEmail("");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TeamDetailSheet
        member={selectedMember}
        hotels={hotels}
        onClose={() => setSelectedMemberId(null)}
        onSaveRole={(userId, roleId, role, hotelId) => roleMutation.mutate({ userId, roleId, newRole: role, hotelId })}
        onDelete={(userId, email) => {
          setDeleteTarget({ userId, email });
          setDeleteConfirmEmail("");
        }}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (open) {
            setForm(emptyTeamForm);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un accès</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="team-first-name">Prénom</Label>
                <Input
                  id="team-first-name"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="team-last-name">Nom</Label>
                <Input
                  id="team-last-name"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="team-email">Email</Label>
              <Input
                id="team-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="team-password">Mot de passe</Label>
              <Input
                id="team-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as typeof f.role }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hotel_admin">Hotel admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.role === "hotel_admin" && (
              <div>
                <Label>Hôtel</Label>
                <Select value={form.hotelId} onValueChange={(v) => setForm((f) => ({ ...f, hotelId: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un hôtel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels?.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Création..." : "Créer l'accès"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cet accès ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Tape <strong>{deleteTarget?.email}</strong> pour confirmer.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmEmail}
            onChange={(e) => setDeleteConfirmEmail(e.target.value)}
            placeholder="Tape l'email pour confirmer..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteConfirmEmail !== deleteTarget?.email || deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.userId)}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminAccounts() {
  const [tab, setTab] = useState("clients");
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comptes</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Clients, partenaires et accès équipe.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-3">
          <TabsList className="rounded-full bg-muted p-1 h-auto">
            <TabsTrigger
              value="clients"
              className="rounded-full px-4 py-1.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none"
            >
              Clients
            </TabsTrigger>
            <TabsTrigger
              value="partenaires"
              className="rounded-full px-4 py-1.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none"
            >
              Partenaires
            </TabsTrigger>
            <TabsTrigger
              value="equipe"
              className="rounded-full px-4 py-1.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none"
            >
              Équipe (accès)
            </TabsTrigger>
          </TabsList>

          {tab === "equipe" && (
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => setTeamDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un accès
            </Button>
          )}
        </div>

        <TabsContent value="clients" className="mt-4">
          <ClientsTab />
        </TabsContent>
        <TabsContent value="partenaires" className="mt-4">
          <ComingSoon title="Partenaires" description="Écran en cours de construction." />
        </TabsContent>
        <TabsContent value="equipe" className="mt-4">
          <TeamTab dialogOpen={teamDialogOpen} setDialogOpen={setTeamDialogOpen} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
