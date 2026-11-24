// « Votre mise en ligne » : où en est le partenaire, en un coup d'œil. Une frise verticale avec trois
// états impossibles à confondre :
//  - fait : rond noir plein avec coche, titre en gris ;
//  - en cours (une seule étape) : rond cerclé de rouge, titre en gras, encadré crème qui dit ce qui se
//    passe, et soit le bouton rouge (c'est son tour), soit « rien à faire pour l'instant » ;
//  - à venir : rond gris, titre normal, une ligne d'explication.
// Pas de mention « qui agit » : les titres le disent déjà (« Nous préparons... », « Vous signez... »).
// Les étapes et l'étape en cours viennent de la base (go live normalisé, voir normalizeGoLive).

import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Hint } from "@/components/partner/ui";
import { cn } from "@/lib/utils";
import { usePartnerAccess } from "@/lib/partner/access";
import { usePartner } from "@/lib/partner/context";
import { actionFor, stepPosition } from "@/lib/partner/golive";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import { formatPartnerDate } from "@/lib/partner/i18n";
import type { GoLive, GoLiveStep } from "@/lib/partner/types";

export function GoLiveCard({ golive, loginEmail }: { golive: GoLive; loginEmail?: string | null }) {
  const { lang } = usePartner();
  const access = usePartnerAccess();
  const g = GOLIVE_TEXTS[lang];
  const t = g.page;
  const action = actionFor(golive, access.mode, access.base, g);
  const actionTo =
    action && action.to === "/partner/login" && loginEmail ? `/partner/login?email=${encodeURIComponent(loginEmail)}` : action?.to;
  const finished = golive.current_step === null;
  const { index, total } = stepPosition(golive);
  const meta = [
    golive.target_date && !finished ? t.target(formatPartnerDate(golive.target_date, lang)) : null,
    golive.commission_ready && golive.commission ? t.commissionAgreed(commissionLabel(golive.commission, lang)) : t.commissionToAgree,
  ].filter(Boolean);
  const copy = (step: GoLiveStep) => t.timeline[golive.kind]?.[step.key] ?? { title: g.steps[step.key] ?? step.key, text: g.stepHelp[step.key] ?? "" };

  return (
    <section className="space-y-5 rounded-[18px] border border-[#E8E0D4] bg-white p-5 sm:p-7" aria-labelledby="golive-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium tracking-[0.16em] rtl:tracking-normal text-brand">{t.goliveEyebrow}</p>
          <h2 id="golive-title" className="text-[24px] font-bold leading-tight text-neutral-900">
            {finished ? t.allDoneTitle : t.stepOf(index, total)}
          </h2>
        </div>
        <p className="text-[13px] text-neutral-500">{meta.join(" · ")}</p>
      </div>

      {/* Barre de progression segmentée : fait en noir, en cours en rouge, à venir en gris. */}
      <div className="flex gap-1" aria-hidden>
        {golive.steps.map((step) => (
          <span
            key={step.key}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              step.key === golive.current_step ? "bg-brand" : step.done ? "bg-neutral-900" : "bg-[#E8E0D4]",
            )}
          />
        ))}
      </div>

      <ol className="flex flex-col">
        {golive.steps.map((step, i) => {
          const isCurrent = step.key === golive.current_step;
          const myTurn = isCurrent && golive.my_turn;
          const last = i === golive.steps.length - 1;
          const { title, text } = copy(step);
          return (
            <li key={step.key} className="flex gap-4" aria-current={isCurrent ? "step" : undefined}>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px]",
                    step.done && "bg-neutral-900 text-white",
                    isCurrent && "border-2 border-brand font-bold text-brand",
                    !step.done && !isCurrent && "border-2 border-neutral-300 text-neutral-500",
                  )}
                >
                  {step.done ? <Check className="h-3.5 w-3.5" aria-label={t.done} /> : i + 1}
                </span>
                {!last && <span className={cn("my-1 w-0.5 flex-1", step.done ? "bg-neutral-900" : "bg-[#E8E0D4]")} aria-hidden />}
              </div>

              {isCurrent ? (
                <div className={cn("mb-4 flex flex-1 flex-col gap-2.5 rounded-[12px] border bg-cream px-4 py-4 sm:px-5", myTurn ? "border-brand/40" : "border-[#E8E0D4]")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[16px] font-bold text-neutral-900">{title}</span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-[11px] font-medium tracking-[0.08em] rtl:tracking-normal text-white",
                        myTurn ? "bg-brand" : "bg-neutral-900",
                      )}
                    >
                      {myTurn ? g.yourTurn.toUpperCase() : t.inProgress}
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-neutral-700">{text}</p>
                  {step.subtasks && (
                    <ul className="space-y-1">
                      {step.subtasks.map((sub) => (
                        <li key={sub.key} className="flex items-center gap-2 text-[13px] text-neutral-700">
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-full",
                              sub.done ? "bg-neutral-900 text-white" : "border border-neutral-300",
                            )}
                            aria-hidden
                          >
                            {sub.done && <Check className="h-2.5 w-2.5" />}
                          </span>
                          <span className={sub.done ? "text-neutral-500" : undefined}>{g.subtasks[sub.key] ?? sub.key}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {step.waiting_commission && <Hint>{g.commissionPending}</Hint>}
                  {myTurn && action && actionTo ? (
                    <div className="space-y-1.5 pt-1">
                      <Link
                        to={actionTo}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 text-[14px] font-semibold text-white hover:bg-brand-hover"
                      >
                        {action.label}
                      </Link>
                      {access.mode === "link" && (step.key === "terms" || step.key === "contract") && <Hint>{g.loginToSignHint}</Hint>}
                    </div>
                  ) : (
                    !myTurn && <p className="text-[13px] leading-relaxed text-neutral-500">{t.nothingToDo}</p>
                  )}
                </div>
              ) : (
                <div className={cn("flex flex-1 flex-wrap justify-between gap-x-3 gap-y-1", last ? "pt-1" : "pb-5 pt-1")}>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className={cn("text-[15px]", step.done ? "text-neutral-500" : "font-medium text-neutral-900")}>{title}</p>
                    {!step.done && <p className="text-[13px] leading-relaxed text-neutral-500">{text}</p>}
                  </div>
                  {step.done && <span className="text-[12px] text-neutral-400">{t.done}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
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
