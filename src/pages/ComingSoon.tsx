import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import comingSoonHero from "@/assets/coming-soon-hero.jpg";
import comingSoonRoad from "@/assets/coming-soon-road.png";
import MarqueeBanner from "@/components/MarqueeBanner";
import { Check, Gift, Star, Calendar, Sparkles } from "lucide-react";
const ComingSoon = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lang, setLang] = useState<'en' | 'he'>('en');
  const isRTL = lang === 'he';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(lang === 'en' ? "Please enter a valid email" : "נא להזין כתובת אימייל תקינה");
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.functions.invoke('collect-lead', {
        body: {
          source: 'coming_soon',
          email: email.toLowerCase().trim(),
          metadata: {
            lang
          }
        }
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast.success(lang === 'en' ? "You're on the list!" : "נרשמת בהצלחה!");
    } catch (error) {
      
      toast.error(lang === 'en' ? "Something went wrong. Please try again." : "משהו השתבש. נסו שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const benefits = lang === 'en' ? [{
    icon: Star,
    text: "First look"
  }, {
    icon: Sparkles,
    text: "Priority access"
  }, {
    icon: Calendar,
    text: "Private events"
  }, {
    icon: Gift,
    text: "Exclusive offers"
  }] : [{
    icon: Star,
    text: "הצצה ראשונה"
  }, {
    icon: Sparkles,
    text: "גישה עדיפה"
  }, {
    icon: Calendar,
    text: "אירועים פרטיים"
  }, {
    icon: Gift,
    text: "הצעות בלעדיות"
  }];
  return <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section - reduced height to show marquee on load */}
      <section className="relative h-[85vh] min-h-[500px] flex flex-col" style={{
      backgroundImage: `url(${comingSoonHero})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/10" />

        {/* Header */}
        <header className="relative z-10 flex justify-between items-center p-4 sm:p-6 md:p-8" dir="ltr">
          <div className="text-white font-bold text-xl sm:text-2xl tracking-tight">
            STAYMAKOM
          </div>
          <button onClick={() => setLang(lang === 'en' ? 'he' : 'en')} className="text-white/90 hover:text-white text-sm font-medium transition-colors px-3 py-1 rounded border border-white/30 hover:border-white/50">
            {lang === 'en' ? 'עב' : 'EN'}
          </button>
        </header>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center">
          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6 font-sans uppercase">
            {lang === 'en' ? <>A NEW WAY OF TRAVELLING<br />IS COMING TO ISRAEL</> : <>דרך חדשה לטייל<br />מגיעה לישראל</>}
          </h1>
          <p className="text-sm sm:text-base font-medium tracking-widest uppercase mb-10 text-secondary">
            {lang === 'en' ? 'Launching 2026' : 'השקה 2026'}
          </p>

          {/* Compact Join the Club Card */}
          <div className="w-full max-w-sm bg-white/85 backdrop-blur-md rounded-xl p-4 sm:p-5 shadow-lg border border-white/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-primary" />
              <h3 className="text-foreground text-sm sm:text-base font-semibold tracking-wide">
                {lang === 'en' ? 'JOIN THE CLUB' : 'הצטרפו למועדון'}
              </h3>
            </div>
            <p className="text-muted-foreground text-xs mb-3">
              {lang === 'en' ? 'Be the first to know' : 'היו הראשונים לדעת'}
            </p>

            {!isSubmitted ? <form onSubmit={handleSubmit}>
                <div className="flex gap-2">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={lang === 'en' ? 'Your email' : 'האימייל שלך'} className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" disabled={isSubmitting} />
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap">
                    {isSubmitting ? lang === 'en' ? '...' : '...' : lang === 'en' ? 'Notify Me' : 'עדכנו אותי'}
                  </button>
                </div>
              </form> : <div className="flex items-center justify-center gap-2 py-2 text-green-600">
                <Check className="w-4 h-4" />
                <span className="font-medium text-sm">
                  {lang === 'en' ? "You're on the list!" : 'נרשמת בהצלחה!'}
                </span>
              </div>}

            {/* Benefits - horizontal compact */}
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
              {benefits.map((benefit, index) => <div key={index} className="flex items-center gap-1 text-muted-foreground text-xs">
                  <benefit.icon className="w-3 h-3 text-primary flex-shrink-0" />
                  <span>{benefit.text}</span>
                </div>)}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 pb-8 flex justify-center">
          <div className="animate-bounce">
            <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Marquee Banner */}
      <MarqueeBanner />

      {/* Immersive Description Section - Text on Image */}
      <section className="relative h-[70vh] min-h-[450px] flex items-center justify-center" style={{
      backgroundImage: `url(${comingSoonRoad})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        
        {/* Centered content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto">
          <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            {lang === 'en' ? 'Not another booking website.' : 'לא עוד אתר הזמנות.'}
          </h3>
          
          <p className="text-white text-sm sm:text-base leading-relaxed mb-2">
            {lang === 'en' ? 'You already know how to book a hotel.' : 'אתם כבר יודעים איך להזמין מלון.'}
          </p>
          <p className="text-white text-sm sm:text-base leading-relaxed mb-8">
            {lang === 'en' ? "What you don't know is what to live once you're there." : 'מה שאתם לא יודעים זה מה לחוות כשאתם שם.'}
          </p>
          
          <p className="text-white text-sm sm:text-base leading-relaxed mb-2">
            {lang === 'en' ? "Whether you're staying two weeks in Tel Aviv and don't know where to start," : 'בין אם אתם נשארים שבועיים בתל אביב ולא יודעים מאיפה להתחיל,'}
          </p>
          <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
            {lang === 'en' ? 'or living in Israel and craving meaningful escapes' : 'או גרים בישראל ומשתוקקים לבריחות משמעותיות'}
          </p>
          
          <p className="text-white text-base sm:text-lg font-medium mb-8">
            {lang === 'en' ? 'STAYMAKOM curates hotels with experiences, in one place.' : 'STAYMAKOM אוצרת מלונות עם חוויות, במקום אחד.'}
          </p>
          
          <p className="text-secondary text-base sm:text-lg font-semibold tracking-wide uppercase">
            {lang === 'en' ? 'Coming soon.' : 'בקרוב.'}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 sm:py-14 bg-muted text-muted-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xl sm:text-2xl font-serif tracking-tight mb-5 text-foreground">
            {lang === 'en' ? 'Handpicked hotels. Unforgettable experiences.' : 'מלונות נבחרים. חוויות בלתי נשכחות.'}
          </p>
          <div className="w-16 h-px bg-foreground/20 mx-auto mb-5" />
          <p className="text-xs text-muted-foreground/60">
            © 2026 StayMakom. {lang === 'en' ? 'All rights reserved.' : 'כל הזכויות שמורות.'}
          </p>
        </div>
      </footer>
    </div>;
};
export default ComingSoon;