import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import { SEOHead } from "@/components/SEOHead";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Privacy Policy | STAYMAKOM"
        description="Learn how STAYMAKOM protects your privacy. Read about data collection, usage, storage, and your rights under Israeli privacy regulations."
      />
      <LaunchHeader forceScrolled={true} />
      <main className="flex-1 container py-8 md:py-12">
        <article className="max-w-2xl mx-auto prose prose-sm prose-slate dark:prose-invert">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-6 text-sm">Last updated: December 1, 2025</p>

          <p className="lead text-sm">
            Staymakom Ltd ("we", "our", "the platform") is committed to protecting your privacy under Israeli privacy regulations and best international standards.
          </p>

          <h2 className="text-lg">1. Data We Collect</h2>
          <p className="text-sm">We may collect the following categories of data:</p>
          
          <h3 className="text-base">Account Data</h3>
          <ul className="text-sm">
            <li>Email address</li>
            <li>Name</li>
            <li>Phone number (if provided)</li>
            <li>Language preferences</li>
          </ul>

          <h3 className="text-base">Booking Data</h3>
          <ul className="text-sm">
            <li>Requested experiences</li>
            <li>Dates, party size</li>
            <li>Communication with hotels</li>
          </ul>

          <h3 className="text-base">Usage Data</h3>
          <ul className="text-sm">
            <li>Device and browser information</li>
            <li>IP address</li>
            <li>Pages visited</li>
            <li>Cookies and analytics data</li>
          </ul>

          <h2 className="text-lg">2. Why We Use Your Data</h2>
          <p className="text-sm">We process your data to:</p>
          <ul className="text-sm">
            <li>operate the platform</li>
            <li>manage bookings</li>
            <li>forward your booking details to hotels</li>
            <li>provide customer support</li>
            <li>prevent fraud or attacks</li>
            <li>improve user experience</li>
            <li>measure traffic performance (analytics)</li>
          </ul>
          <p className="text-sm"><strong>We never sell your data.</strong></p>

          <h2 className="text-lg">3. Sharing of Data</h2>
          <p className="text-sm">Your data may be shared with:</p>
          <ul className="text-sm">
            <li>Hotels (only when you submit a booking request)</li>
            <li>Stripe (for secure payment processing)</li>
            <li>Analytics tools (Google Analytics, Meta Pixel)</li>
            <li>Authorities (only if legally required)</li>
          </ul>

          <h2 className="text-lg">4. Cookies</h2>
          <p className="text-sm">We use cookies to:</p>
          <ul className="text-sm">
            <li>enable login</li>
            <li>maintain session state</li>
            <li>measure performance</li>
            <li>analyse traffic</li>
            <li>improve suggestions and content</li>
          </ul>
          <p className="text-sm">You can disable non-essential cookies at any time.</p>

          <h2 className="text-lg">5. Data Storage & International Transfers</h2>
          <p className="text-sm">Data is stored securely via:</p>
          <ul className="text-sm">
            <li>Supabase (EU/US data centers)</li>
            <li>Stripe (USA/Europe)</li>
          </ul>
          <p className="text-sm">We apply industry-standard safeguards for cross-border transfers.</p>

          <h2 className="text-lg">6. Your Rights</h2>
          <p className="text-sm">Under Israeli Privacy Protection Law, you may:</p>
          <ul className="text-sm">
            <li>request access to your data</li>
            <li>request correction or deletion</li>
            <li>withdraw consent for marketing</li>
            <li>request data portability (when applicable)</li>
          </ul>
          <p className="text-sm">
            Contact: <a href="mailto:hello@staymakom.com" className="text-primary hover:underline">hello@staymakom.com</a>
          </p>

          <h2 className="text-lg">7. Retention</h2>
          <p className="text-sm">We keep account and booking data as long as your profile is active, or as required by law.</p>

          <h2 className="text-lg">8. Updates</h2>
          <p className="text-sm">We may occasionally update this policy.</p>
        </article>
      </main>
      <LaunchFooter />
    </div>
  );
};

export default Privacy;