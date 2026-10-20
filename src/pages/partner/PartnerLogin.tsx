// Connexion à l'espace partenaire, sans mot de passe.
//  - Sans jeton : on saisit son email, on reçoit un lien.
//  - Avec le jeton du lien reçu (`?token_hash=`) : un bouton « Entrer dans mon espace ». Le jeton
//    n'est échangé contre une session qu'à ce clic, pour qu'un aperçu de lien ne le consomme pas.

import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Hint, Notice, PrimaryButton, TextField } from "@/components/partner/ui";
import { LanguageSwitch, PartnerBrand } from "@/components/partner/PartnerShell";
import { requestPartnerLoginLink, signInWithPartnerToken } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";

export default function PartnerLogin() {
  const { t } = usePartner();
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenHash = searchParams.get("token_hash");

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enter = async () => {
    if (!tokenHash) return;
    setBusy(true);
    setError(null);
    try {
      // La session ouverte, l'espace s'affiche tout seul (l'écran parent suit l'état de connexion).
      await signInWithPartnerToken(tokenHash);
    } catch {
      setError(t.loginTokenExpired);
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.delete("token_hash");
        return next;
      }, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const requestLink = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await requestPartnerLoginLink(email.trim());
      setSent(true);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <div className="flex items-center justify-between">
        <PartnerBrand />
        <LanguageSwitch />
      </div>

      <div className="flex flex-1 flex-col justify-center py-10">
        <Card className="space-y-5 p-6">
          {tokenHash ? (
            <>
              <div className="space-y-2">
                <h1 className="text-[17px] font-semibold tracking-tight text-neutral-900">{t.loginTokenTitle}</h1>
                <Hint>{t.loginTokenIntro}</Hint>
              </div>
              <PrimaryButton className="sm:w-full" busy={busy} onClick={enter}>
                {t.loginTokenButton}
              </PrimaryButton>
            </>
          ) : (
            <form className="space-y-5" onSubmit={requestLink}>
              <div className="space-y-2">
                <h1 className="text-[17px] font-semibold tracking-tight text-neutral-900">{t.loginTitle}</h1>
                <Hint>{t.loginIntro}</Hint>
              </div>
              {error && <Notice tone="urgent">{error}</Notice>}
              {sent ? (
                <Notice>{t.loginSent}</Notice>
              ) : (
                <>
                  <TextField
                    label={t.loginEmail}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    dir="ltr"
                    required
                    value={email}
                    onChange={setEmail}
                  />
                  <PrimaryButton type="submit" className="sm:w-full" busy={busy}>
                    {t.loginSend}
                  </PrimaryButton>
                </>
              )}
            </form>
          )}
        </Card>
        <p className="mt-6 text-center text-[12px] text-neutral-500">{t.team}</p>
      </div>
    </div>
  );
}
