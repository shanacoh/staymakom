// Le bloc « Go live », en tête de l'espace partenaire : les étapes calculées par la base, qui doit
// agir à chaque étape, une seule étape « votre tour » (en rouge) avec un seul bouton.

import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Card, Hint, Pill } from "@/components/partner/ui";
import { cn } from "@/lib/utils";
import { usePartnerAccess } from "@/lib/partner/access";
import { usePartner } from "@/lib/partner/context";
import { actionFor } from "@/lib/partner/golive";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import { formatPartnerDate } from "@/lib/partner/i18n";
import type { GoLive } from "@/lib/partner/types";

export function GoLiveCard({ golive, loginEmail }: { golive: GoLive; loginEmail?: string | null }) {
  const { lang } = usePartner();
  const access = usePartnerAccess();
  const t = GOLIVE_TEXTS[lang];
  const action = actionFor(golive, access.mode, access.base, t);
  const actionTo =
    action && action.to === "/partner/login" && loginEmail ? `/partner/login?email=${encodeURIComponent(loginEmail)}` : action?.to;
  const finished = golive.current_step === null;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight">{t.goliveTitle}</h2>
        {golive.target_date && <span className="text-[12px] text-neutral-500">{t.goliveTarget(formatPartnerDate(golive.target_date, lang))}</span>}
      </div>

      {finished ? (
        <p className="text-[13px] font-medium text-neutral-900">{t.allDone}</p>
      ) : (
        <ol className="space-y-2.5">
          {golive.steps.map((step, index) => {
            const isCurrent = step.key === golive.current_step;
            const myTurn = isCurrent && golive.my_turn;
            return (
              <li key={step.key} className={cn("flex gap-3", myTurn && "rounded-[10px] border border-[#ad1414]/40 bg-[#ad1414]/[0.04] p-2.5")}>
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    step.done ? "bg-neutral-900 text-white" : myTurn ? "bg-[#ad1414] text-white" : "border border-neutral-300 text-neutral-500",
                  )}
                  aria-hidden
                >
                  {step.done ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-[13px] font-semibold", step.done ? "text-neutral-500" : "text-neutral-900")}>
                      {t.steps[step.key] ?? step.key}
                    </span>
                    {step.done ? (
                      <Pill tone="muted">{t.stepDone}</Pill>
                    ) : myTurn ? (
                      <Pill tone="urgent">{t.yourTurn}</Pill>
                    ) : (
                      <span className="text-[11px] text-neutral-500">{step.actor === "partner" ? t.actorYou : t.actorTeam}</span>
                    )}
                  </div>
                  {isCurrent && !step.done && (
                    <>
                      <Hint>{step.actor === "partner" ? t.stepHelp[step.key] : t.waitingTeam}</Hint>
                      {step.waiting_commission && <Hint>{t.commissionPending}</Hint>}
                    </>
                  )}
                  {step.subtasks && isCurrent && (
                    <ul className="space-y-0.5 pt-0.5">
                      {step.subtasks.map((sub) => (
                        <li key={sub.key} className="flex items-center gap-1.5 text-[12px] text-neutral-600">
                          <span className={sub.done ? "text-neutral-900" : "text-neutral-400"}>{sub.done ? "●" : "○"}</span>
                          {t.subtasks[sub.key] ?? sub.key}
                        </li>
                      ))}
                    </ul>
                  )}
                  {myTurn && action && actionTo && (
                    <div className="pt-1.5">
                      <Link
                        to={actionTo}
                        className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[#ad1414] px-5 text-[13px] font-semibold text-white hover:bg-[#8a1010]"
                      >
                        {action.label}
                      </Link>
                      {access.mode === "link" && (step.key === "terms" || step.key === "contract") && (
                        <Hint className="pt-1.5">{t.loginToSignHint}</Hint>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="space-y-1 border-t border-neutral-100 pt-3 text-[12px] text-neutral-600">
        {golive.counts.total > 0 && <p>{t.counts(golive.counts.prepared_by_team, golive.counts.total, golive.counts.for_you)}</p>}
        <p>{golive.commission_ready && golive.commission ? t.commissionLine(commissionLabel(golive.commission, lang)) : t.commissionPending}</p>
      </div>
    </Card>
  );
}

/** « 20 % », « 30 ILS par personne »... Le partenaire voit sa commission, jamais le prix client. */
export function commissionLabel(commission: NonNullable<GoLive["commission"]>, lang: string): string {
  if (commission.type === "percent") return `${commission.value}%`;
  const unit =
    commission.unit === "per_person"
      ? { fr: "par personne", en: "per person", he: "לאדם" }
      : { fr: "par réservation", en: "per booking", he: "להזמנה" };
  return `${commission.value} ILS ${unit[lang as "fr" | "en" | "he"] ?? unit.en}`;
}
