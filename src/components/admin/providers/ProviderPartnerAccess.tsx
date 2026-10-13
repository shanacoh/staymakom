import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/catalogue/queries";
import { fetchProviderAccess, invitePartner, partnerAdminKeys } from "@/lib/partnerAdmin/queries";
import { buildInviteMessage, whatsappInviteUrl } from "@/lib/partnerAdmin/whatsapp";
import { PROVIDERS_QUERY_KEY } from "@/lib/providers/queries";
import type { Provider } from "@/lib/providers/types";

// Espace partenaire d'un prestataire : où il en est (invité, conditions acceptées, dernière
// connexion), l'invitation par email et le message WhatsApp à copier. Rien ne part seul par WhatsApp.

const moment = (iso: string) => format(parseISO(iso), "d MMM yyyy 'à' HH:mm", { locale: fr });

function Step({ done, label, detail }: { done: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-baseline gap-2 text-sm">
      <span className={done ? "font-semibold text-foreground" : "text-muted-foreground"}>{done ? "●" : "○"}</span>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>
        {label}
        {detail && <span className="text-xs text-muted-foreground"> · {detail}</span>}
      </span>
    </li>
  );
}

export function ProviderPartnerAccess({ provider }: { provider: Provider }) {
  const queryClient = useQueryClient();
  const [extraEmail, setExtraEmail] = useState("");
  const access = useQuery({ queryKey: partnerAdminKeys.access(provider.id), queryFn: () => fetchProviderAccess(provider.id) });

  const invite = useMutation({
    mutationFn: (email?: string) => invitePartner(provider.id, email),
    onSuccess: ({ email }) => {
      toast.success(`Invitation envoyée à ${email}`);
      setExtraEmail("");
      queryClient.invalidateQueries({ queryKey: partnerAdminKeys.access(provider.id) });
      queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const users = access.data?.users ?? [];
  const invited = users.length > 0;
  const acceptance = access.data?.acceptance ?? null;
  const lastLogin = users.map((u) => u.last_login_at).filter(Boolean).sort().pop() ?? null;
  const pending = access.data?.pendingProposals ?? 0;

  // Les conditions acceptées sont celles de la version en vigueur seulement si la fiche le dit encore.
  const termsUpToDate = !!provider.terms_accepted_at && !!acceptance && String(acceptance.version) === provider.terms_version;

  const message = buildInviteMessage({ language: provider.language, contactName: provider.contact_name, email: users[0]?.email ?? provider.email });
  const whatsappUrl = whatsappInviteUrl(provider.whatsapp, message);
  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Message copié");
    } catch {
      toast.error("Copie impossible. Sélectionne le texte à la main.");
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Espace partenaire</h3>
          <p className="text-xs text-muted-foreground">
            L'invitation part par email à {provider.email ? <strong>{provider.email}</strong> : "l'email du contact principal"}, dans sa langue
            {provider.language ? "" : " (langue non renseignée : anglais)"}. Il se connecte par lien, sans mot de passe.
          </p>
        </div>
        {pending > 0 && (
          <Link
            to="/admin/partenaires/propositions"
            className="rounded-full bg-action px-3 py-1 text-xs font-semibold text-action-foreground hover:bg-action-hover"
          >
            {pending} proposition{pending > 1 ? "s" : ""} à valider
          </Link>
        )}
      </div>

      <ul className="space-y-1">
        <Step done={invited} label={invited ? "Invité" : "Pas invité"} detail={invited ? `le ${moment(users[0].invited_at)}` : undefined} />
        <Step
          done={termsUpToDate}
          label={termsUpToDate ? "Conditions acceptées" : acceptance ? "Nouvelle version des conditions à accepter" : "Conditions pas encore acceptées"}
          detail={
            acceptance
              ? `version ${acceptance.version}, le ${moment(acceptance.accepted_at)}, par ${acceptance.signer_name}${acceptance.ip_address ? ` (IP ${acceptance.ip_address})` : ""}`
              : undefined
          }
        />
        <Step done={!!lastLogin} label={lastLogin ? "Dernière connexion" : "Jamais connecté"} detail={lastLogin ? moment(lastLogin) : undefined} />
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={invite.isPending || !provider.email} onClick={() => invite.mutate(undefined)}>
          <Send className="mr-1.5 h-4 w-4" />
          {invite.isPending ? "Envoi…" : invited ? "Renvoyer l'invitation" : "Inviter"}
        </Button>
        <Button type="button" variant="outline" disabled={!invited} onClick={copyMessage} title={invited ? undefined : "Invite d'abord le prestataire"}>
          <Copy className="mr-1.5 h-4 w-4" />
          Copier le message WhatsApp
        </Button>
        {invited && whatsappUrl ? (
          <Button type="button" variant="outline" asChild>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-1.5 h-4 w-4" />
              Ouvrir WhatsApp
            </a>
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled title={invited ? "Renseigne son numéro WhatsApp sur la fiche" : "Invite d'abord le prestataire"}>
            <MessageCircle className="mr-1.5 h-4 w-4" />
            Ouvrir WhatsApp
          </Button>
        )}
      </div>
      {!provider.email && (
        <p className="text-xs text-destructive">Renseigne et enregistre l'email du contact principal pour pouvoir l'inviter.</p>
      )}

      {invited && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-semibold text-foreground">Utilisateurs de ce prestataire</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {users.map((user) => (
              <li key={user.id}>
                <span className="text-foreground">{user.email}</span> · invité le {moment(user.invited_at)} ·{" "}
                {user.last_login_at ? `dernière connexion ${moment(user.last_login_at)}` : "jamais connecté"}
              </li>
            ))}
          </ul>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (extraEmail.trim()) invite.mutate(extraEmail.trim());
            }}
          >
            <Input
              type="email"
              value={extraEmail}
              onChange={(e) => setExtraEmail(e.target.value)}
              placeholder="Inviter une autre adresse de ce prestataire"
              className="h-9 max-w-xs text-xs"
            />
            <Button type="submit" variant="outline" size="sm" disabled={invite.isPending || !extraEmail.trim()}>
              Inviter cette adresse
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
