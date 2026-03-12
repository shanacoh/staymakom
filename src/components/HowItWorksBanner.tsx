import { useLanguage } from "@/hooks/useLanguage";
const HowItWorksBanner = () => {
  const {
    lang
  } = useLanguage();
  const isRTL = lang === 'he';
  const steps = isRTL ? [{
    number: "1",
    line1: "בחר",
    line2: "את האווירה"
  }, {
    number: "2",
    line1: "בחר",
    line2: "את החוויה"
  }, {
    number: "3",
    line1: "הזמן",
    line2: "את המלון"
  }] : [{
    number: "1",
    line1: "Choose",
    line2: "your vibe"
  }, {
    number: "2",
    line1: "Pick",
    line2: "your experience"
  }, {
    number: "3",
    line1: "Book",
    line2: "your hotel"
  }];
  return <section className="bg-foreground py-2.5 sm:py-4 cursor-default select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container px-4">
        <div className="flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-0 md:gap-0">
          {steps.map((step, index) => <div key={index} className="flex items-center gap-2 sm:gap-0 md:gap-0">
              <span className="flex flex-col items-center sm:flex-row sm:items-center gap-0 sm:gap-2.5 px-3 sm:px-5 md:px-8">
                <span className="font-bold text-lg sm:text-2xl md:text-3xl text-card">{step.number}</span>
                <span className="font-medium text-white text-[10px] sm:text-sm md:text-base uppercase tracking-wide text-center sm:text-left sm:whitespace-nowrap pointer-events-none">
                  {step.line1}<br className="sm:hidden" /> {step.line2}
                </span>
              </span>
              {index < steps.length - 1 && <span className="hidden sm:block w-px h-6 md:h-8 bg-white/20" />}
              {index < steps.length - 1 && <span className="sm:hidden text-white/30 text-xs">•</span>}
            </div>)}
        </div>
      </div>
    </section>;
};
export default HowItWorksBanner;