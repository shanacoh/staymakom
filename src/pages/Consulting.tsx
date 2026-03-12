import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import founderPhoto from "@/assets/founder-shana.jpg";
import desertHero from "@/assets/desert-hero.jpg";

const SERVICES = [
  {
    number: "01",
    title: "Multilingual Presence",
    description:
      "Your property deserves to be found, understood, and booked by guests who don't speak Hebrew. We build the digital foundation that makes that happen.",
    deliverables: [
      "Website copy in English, French, Spanish, German, and more",
      "OTA listing optimization in target languages",
      "Google Business and Maps localization",
      "Social media content adapted per market",
    ],
  },
  {
    number: "02",
    title: "Influencer Market Strategy",
    description:
      "We connect your property with the right voices in the right markets. Not vanity metrics. Real guests, real bookings.",
    deliverables: [
      "Influencer identification and vetting per target market",
      "Campaign design and negotiation",
      "Content usage rights and repurposing strategy",
      "Performance tracking and ROI reporting",
    ],
  },
  {
    number: "03",
    title: "Brand & Positioning",
    description:
      "Most Israeli hotels market themselves the same way. We help you find what makes you different and communicate it clearly to international travelers.",
    deliverables: [
      "Brand audit and competitive analysis",
      "Positioning statement and messaging framework",
      "Visual identity recommendations",
      "Guest journey mapping for international visitors",
    ],
  },
];

const RESULTS = [
  {
    venue: "Desert boutique hotel",
    situation: "Zero international bookings. English website was a Google Translate copy.",
    result: "42% of bookings now come from non-Israeli guests within 6 months.",
  },
  {
    venue: "Galilee wine estate",
    situation: "Strong local reputation but invisible to the French-speaking market.",
    result: "Featured in 3 French travel publications. 28% revenue increase in Q1.",
  },
  {
    venue: "Tel Aviv design hotel",
    situation: "Beautiful property, no coherent brand story for international audiences.",
    result: "Repositioned as a design destination. ADR increased by 18%.",
  },
  {
    venue: "Dead Sea wellness resort",
    situation: "Competing on price with large chains. No differentiation online.",
    result: "New positioning attracted high-value wellness travelers from Germany and Austria.",
  },
];

const CLIENTS = [
  {
    title: "Boutique hotels",
    description: "Independent properties with 10 to 80 rooms looking to attract international guests.",
  },
  {
    title: "Wine and culinary estates",
    description: "Properties combining accommodation with food, wine, or agricultural experiences.",
  },
  {
    title: "Wellness retreats",
    description: "Desert spas, yoga centers, and holistic properties targeting health-conscious travelers.",
  },
  {
    title: "Heritage and design hotels",
    description: "Architecturally significant or historically rooted properties with a story to tell.",
  },
  {
    title: "Regional tourism boards",
    description: "Organizations promoting a specific area of Israel to international visitors.",
  },
];

const LANGUAGES = [
  "English",
  "French",
  "Spanish",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Russian",
  "Japanese",
  "Korean",
  "Mandarin",
  "Arabic",
];

const Consulting = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        titleEn="Consulting | STAYMAKOM - Make Israel Speak Every Language"
        descriptionEn="STAYMAKOM consulting helps Israeli hospitality brands reach international travelers through multilingual content, influencer strategy, and brand positioning."
      />

      <Header />

      <main>
        {/* ─── HERO ─── */}
        <section className="relative h-[65vh] min-h-[440px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={desertHero}
              alt="Israeli landscape"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="relative z-10 text-center text-white px-6 max-w-3xl mx-auto">
            <p className="font-sans text-xs sm:text-sm uppercase tracking-[0.2em] text-white/70 mb-5">
              STAYMAKOM CONSULTING
            </p>
            <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[-0.02em] leading-[1.1] mb-5 text-white">
              Make Israel speak
              <br />
              every language.
            </h1>
            <p className="text-base sm:text-lg text-white/80 font-light mb-8 max-w-xl mx-auto">
              We help Israeli hospitality brands become visible, bookable, and
              irresistible to international travelers.
            </p>
            <a
              href="#contact-section"
              className="inline-block px-10 py-4 bg-white text-foreground font-semibold uppercase tracking-wide text-sm rounded-md shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:brightness-110 transition-all duration-300 cursor-pointer"
            >
              Start a conversation
            </a>
          </div>
        </section>

        {/* ─── THE GAP ─── */}
        <section className="py-20 px-6 bg-background">
          <div className="max-w-5xl mx-auto">
            <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground mb-6">
              THE GAP
            </p>
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <div>
                <h2 className="font-sans text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-[-0.02em] text-foreground mb-6">
                  Israel's best-kept secrets
                  <br />
                  are still secrets.
                </h2>
                <p className="font-sans text-base leading-relaxed text-muted-foreground mb-4">
                  Israel has world-class hospitality. Boutique hotels in the
                  desert, wine estates in the Galilee, design properties in Tel
                  Aviv. But internationally, most of them are invisible.
                </p>
                <p className="font-sans text-base leading-relaxed text-muted-foreground">
                  The websites are in Hebrew. The OTA listings are poorly
                  translated. The social media speaks to locals. International
                  travelers don't find these properties because nobody is
                  speaking their language.
                </p>
              </div>
              <div className="flex items-center">
                <blockquote className="border-l-2 border-accent pl-6">
                  <p className="font-serif text-xl md:text-2xl italic text-foreground/80 leading-relaxed">
                    "The product is extraordinary. The communication is
                    nonexistent. That's the gap we close."
                  </p>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SERVICES ─── */}
        <section className="py-20 px-6 bg-card">
          <div className="max-w-5xl mx-auto">
            <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground mb-6">
              WHAT WE DO
            </p>
            <h2 className="font-sans text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-[-0.02em] text-foreground mb-14">
              Three ways we make you visible.
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {SERVICES.map((service) => (
                <div
                  key={service.number}
                  className="border border-border/40 rounded-lg p-6 bg-background"
                >
                  <span className="font-sans text-xs text-muted-foreground tracking-[0.15em]">
                    {service.number}
                  </span>
                  <h3 className="font-sans text-lg font-semibold uppercase tracking-[0.03em] text-foreground mt-2 mb-3">
                    {service.title}
                  </h3>
                  <p className="font-sans text-sm leading-relaxed text-muted-foreground mb-5">
                    {service.description}
                  </p>
                  <ul className="space-y-2">
                    {service.deliverables.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-foreground/75"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── RESULTS ─── */}
        <section className="py-20 px-6 bg-background">
          <div className="max-w-5xl mx-auto">
            <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground mb-6">
              RESULTS
            </p>
            <h2 className="font-sans text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-[-0.02em] text-foreground mb-14">
              What happens when you start
              <br />
              speaking the right language.
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {RESULTS.map((item, i) => (
                <div
                  key={i}
                  className="border border-border/40 rounded-lg p-6 bg-card"
                >
                  <p className="font-sans text-xs uppercase tracking-[0.15em] text-accent font-medium mb-3">
                    {item.venue}
                  </p>
                  <p className="font-sans text-sm italic text-muted-foreground mb-4 leading-relaxed">
                    {item.situation}
                  </p>
                  <p className="font-sans text-sm font-medium text-foreground flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                    {item.result}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHO WE WORK WITH ─── */}
        <section className="py-20 px-6 bg-card">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground mb-6">
                  WHO THIS IS FOR
                </p>
                <h2 className="font-sans text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-[-0.02em] text-foreground">
                  We work with properties
                  <br />
                  that deserve to be found.
                </h2>
              </div>
              <div className="space-y-5">
                {CLIENTS.map((client, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-2 w-2 h-2 rounded-full bg-foreground flex-shrink-0" />
                    <div>
                      <p className="font-sans text-sm font-semibold text-foreground">
                        {client.title}
                      </p>
                      <p className="font-sans text-sm text-muted-foreground">
                        {client.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── LANGUAGES ─── */}
        <section className="py-16 px-6 bg-background">
          <div className="max-w-5xl mx-auto">
            <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground mb-6">
              LANGUAGES WE COVER
            </p>
            <div className="flex flex-wrap gap-3">
              {LANGUAGES.map((lang) => (
                <span
                  key={lang}
                  className="px-4 py-2 rounded-full border border-border/60 text-sm font-sans text-foreground/80 bg-card"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── ABOUT SHANA ─── */}
        <section className="py-20 px-6 bg-card">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground mb-6">
                  WHO'S BEHIND THIS
                </p>
                <h2 className="font-sans text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-[-0.02em] text-foreground">
                  Built on 7+ years
                  <br />
                  in hospitality.
                </h2>
              </div>
              <div>
                <p className="font-serif text-lg italic text-foreground/80 mb-6 leading-relaxed">
                  "I moved to Israel and realized the hospitality here is
                  incredible. But the world doesn't know. I started STAYMAKOM to
                  fix that."
                </p>
                <p className="font-sans text-sm leading-relaxed text-muted-foreground mb-4">
                  Shana built STAYMAKOM from the ground up after years of working
                  with boutique hotels across the country. She saw the same
                  pattern everywhere: extraordinary properties with no
                  international visibility.
                </p>
                <p className="font-sans text-sm leading-relaxed text-muted-foreground">
                  Today, the consulting arm of STAYMAKOM works directly with
                  hotels, resorts, and tourism organizations to build the
                  multilingual presence and positioning they need to compete
                  globally. Every strategy is tailored. Every market is
                  researched. Every word is intentional.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section
          id="contact-section"
          className="py-24 px-6 bg-foreground text-primary-foreground"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-[-0.02em] mb-6">
              Ready to welcome
              <br />
              the world?
            </h2>
            <p className="text-primary-foreground/70 text-base mb-10 max-w-lg mx-auto">
              Let's talk about your property, your market, and what it takes to
              get international guests through your door.
            </p>
            <a
              href="mailto:consulting@staymakom.com"
              className="inline-block px-10 py-4 bg-white text-foreground font-semibold uppercase tracking-wide text-sm rounded-md shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer mb-6"
            >
              Start a conversation
            </a>
            <p className="flex items-center justify-center gap-2 text-sm text-primary-foreground/60">
              <Mail className="w-4 h-4" />
              consulting@staymakom.com
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Consulting;
