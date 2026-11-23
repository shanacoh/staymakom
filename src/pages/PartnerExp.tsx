import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero-road-desert.jpg";
import partnersHeroImg from "@/assets/partners-hero.jpg";
import desertJourneyImg from "@/assets/desert-journey.jpg";

import { PARTNER_PITCH as T, pitchText as tx, type PitchLang as Lang } from "@/content/partnerPitch";

// ── Component ──────────────────────────────────────────────────────────────────

const PartnerExp = () => {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const isRTL = lang === "he";

  const [current, setCurrent] = useState(0);
  const TOTAL = 3;
  const touchStartX = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((idx: number) => {
    setCurrent(Math.max(0, Math.min(TOTAL - 1, idx)));
  }, []);

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) {
      isRTL ? prev() : next();
    } else {
      isRTL ? next() : prev();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") isRTL ? prev() : next();
      if (e.key === "ArrowLeft") isRTL ? next() : prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, isRTL]);

  const slideImgs = [heroImg, partnersHeroImg, desertJourneyImg];

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-white" dir={isRTL ? "rtl" : "ltr"}>
      <V3Header />

      <main
        className="flex-1 relative overflow-hidden pt-14"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Track */}
        <div
          ref={trackRef}
          className="flex h-[calc(100vh-56px)]"
          style={{
            width: `${TOTAL * 100}%`,
            transform: `translateX(${isRTL ? (current / TOTAL) * 100 : -(current / TOTAL) * 100}%)`,
            transition: "transform 0.35s ease",
          }}
        >
          {/* ── SLIDE 1 ── */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: `${100 / TOTAL}%` }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slideImgs[0]})` }}
            />
            <div className="absolute inset-0 bg-black/52" />
            <div
              className="relative z-10 text-white text-center px-6 max-w-2xl mx-auto space-y-6"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-white/70 font-sans">
                {tx("eyebrow", l)}
              </p>
              <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-[-0.02em] whitespace-pre-line">
                {tx("slide1Headline", l)}
              </h1>
              <p className="text-sm sm:text-base text-white/85 max-w-lg mx-auto leading-relaxed">
                {tx("slide1Body", l)}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {(["pill1", "pill2", "pill3"] as const).map((k) => (
                  <span
                    key={k}
                    className="px-3 py-1.5 rounded-full bg-white/10 border border-white/25 text-white text-xs font-medium backdrop-blur-sm"
                  >
                    {tx(k, l)}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-center pt-2">
                <Link
                  to="/"
                  className="px-8 py-3 rounded-md bg-[#ad1414] hover:bg-[#B06540] text-white text-sm font-semibold uppercase tracking-wide transition-all duration-200 shadow-md hover:-translate-y-0.5"
                >
                  {tx("ctaSecondary", l)}
                </Link>
              </div>
            </div>
          </div>

          {/* ── SLIDE 2 ── */}
          <div
            className="relative flex items-center justify-center overflow-y-auto py-20"
            style={{ width: `${100 / TOTAL}%` }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slideImgs[1]})` }}
            />
            <div className="absolute inset-0 bg-black/60" />
            <div
              className="relative z-10 w-full max-w-3xl mx-auto px-6 space-y-8"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-[1.15] tracking-[-0.02em] text-center whitespace-pre-line">
                {tx("slide2Headline", l)}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {(
                  [
                    ["card1Title", "card1Body"],
                    ["card2Title", "card2Body"],
                    ["card3Title", "card3Body"],
                    ["card4Title", "card4Body"],
                  ] as [keyof typeof T, keyof typeof T][]
                ).map(([titleK, bodyK]) => (
                  <div
                    key={titleK}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 space-y-1.5"
                  >
                    <p className="font-sans font-semibold text-white text-sm uppercase tracking-[0.06em]">
                      {tx(titleK, l)}
                    </p>
                    <p className="font-sans text-xs text-white/80 leading-relaxed">
                      {tx(bodyK, l)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-l-4 border-[#ad1414] bg-white/8 backdrop-blur-sm rounded-r-xl px-5 py-4">
                <p className="text-white text-xs sm:text-sm leading-relaxed font-medium italic">
                  {tx("callout", l)}
                </p>
              </div>
            </div>
          </div>

          {/* ── SLIDE 3 ── */}
          <div
            className="relative flex items-center justify-center overflow-y-auto py-20"
            style={{ width: `${100 / TOTAL}%` }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slideImgs[2]})` }}
            />
            <div className="absolute inset-0 bg-black/68" />
            <div
              className="relative z-10 w-full max-w-4xl mx-auto px-6 space-y-6"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <div className="text-center space-y-2">
                <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-[1.15] tracking-[-0.02em] whitespace-pre-line">
                  {tx("slide3Headline", l)}
                </h2>
                <p className="text-white/75 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                  {tx("slide3Sub", l)}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* Left */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    {(["step1", "step2", "step3", "step4"] as const).map((k, i) => (
                      <div key={k} className="flex gap-3 items-start">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-[#ad1414] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-white/90 text-xs sm:text-sm leading-relaxed">{tx(k, l)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/8 backdrop-blur-sm rounded-xl border border-white/15 p-3 space-y-2">
                    {(["notif1", "notif2", "notif3"] as const).map((k) => (
                      <div key={k} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-[#ad1414] shrink-0" />
                        <span className="text-white/85 text-xs">{tx(k, l)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — mockup */}
                <AppMockup lang={l} isRTL={isRTL} />
              </div>
            </div>
          </div>
        </div>

        {/* Arrows */}
        <button
          onClick={isRTL ? next : prev}
          disabled={isRTL ? current === TOTAL - 1 : current === 0}
          aria-label="Previous"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-all disabled:opacity-20",
            isRTL ? "right-4 md:right-8" : "left-4 md:left-8"
          )}
        >
          {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        <button
          onClick={isRTL ? prev : next}
          disabled={isRTL ? current === 0 : current === TOTAL - 1}
          aria-label="Next"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-all disabled:opacity-20",
            isRTL ? "left-4 md:left-8" : "right-4 md:right-8"
          )}
        >
          {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2" dir="ltr">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>
    </div>
  );
};

// ── App Mockup ─────────────────────────────────────────────────────────────────

const CALENDAR_DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const CAL_STATE: ("empty" | "avail" | "booked")[] = [
  "empty", "avail", "avail", "booked", "avail", "avail", "empty",
  "avail", "avail", "booked", "booked", "avail", "avail", "avail",
  "avail", "booked", "avail", "avail", "avail", "empty", "empty",
];

const AppMockup = ({ lang, isRTL }: { lang: Lang; isRTL: boolean }) => {
  const exps = [
    { name: tx("mockupExp1", lang), on: true },
    { name: tx("mockupExp2", lang), on: false },
    { name: tx("mockupExp3", lang), on: true },
  ];

  return (
    <div
      className="bg-black/80 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-3 max-w-xs mx-auto w-full"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {CALENDAR_DAYS.map((d, i) => (
          <span key={i} className="text-[9px] text-white/40 font-medium pb-1">{d}</span>
        ))}
        {CAL_STATE.map((state, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded-sm flex items-center justify-center text-[9px] font-medium",
              state === "avail" && "bg-emerald-500/70 text-white",
              state === "booked" && "bg-red-400/70 text-white",
              state === "empty" && "bg-white/5"
            )}
          >
            {state !== "empty" ? i + 1 : ""}
          </div>
        ))}
      </div>

      <div className="border-t border-white/10" />

      <div className="space-y-2">
        {exps.map(({ name, on }, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-white/80 truncate">{name}</span>
            <div
              className={cn(
                "w-8 h-4 rounded-full flex items-center px-0.5 transition-colors",
                on ? "bg-[#ad1414]" : "bg-white/20"
              )}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full bg-white shadow transition-transform",
                  on ? "translate-x-4" : "translate-x-0"
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10" />

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/8 rounded-lg p-2 text-center">
          <p className="text-[9px] text-white/50 uppercase tracking-wide">{tx("mockupBookings", lang)}</p>
          <p className="text-base font-bold text-white mt-0.5">12</p>
        </div>
        <div className="bg-white/8 rounded-lg p-2 text-center">
          <p className="text-[9px] text-white/50 uppercase tracking-wide">{tx("mockupRevenue", lang)}</p>
          <p className="text-base font-bold text-[#ad1414] mt-0.5">3 060 ₪</p>
        </div>
      </div>
    </div>
  );
};

export default PartnerExp;
