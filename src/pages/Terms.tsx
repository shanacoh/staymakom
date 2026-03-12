import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import { SEOHead } from "@/components/SEOHead";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Terms & Conditions | STAYMAKOM"
        description="Read STAYMAKOM's Terms & Conditions. Learn about our booking platform, user responsibilities, and policies for discovering unique hospitality experiences in Israel."
      />
      <LaunchHeader forceScrolled={true} />
      <main className="flex-1 container py-8 md:py-12">
        <article className="max-w-2xl mx-auto prose prose-sm prose-slate dark:prose-invert">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground mb-6 text-sm">Last updated: December 1, 2025</p>

          <p className="lead text-sm">
            Welcome to STAYMAKOM LTD, a curated discovery and booking platform showcasing unique hospitality experiences across Israel.
          </p>
          <p className="text-sm">By accessing or using the Staymakom platform, you agree to the Terms & Conditions below.</p>

          <h2 className="text-lg">1. About Staymakom</h2>
          <p className="text-sm">
            Staymakom Ltd (registered in Israel, address: 6 Sokolov Street, Herzliya) operates a digital platform connecting users with hotels and hospitality partners.
          </p>
          <p className="text-sm">Staymakom:</p>
          <ul className="text-sm">
            <li>does not own, operate, or manage the hotels listed on the platform;</li>
            <li>does not provide accommodation or activities directly;</li>
            <li>acts solely as an intermediary facilitating the discovery and booking of hotel-operated experiences.</li>
          </ul>

          <h2 className="text-lg">2. Booking Flow</h2>
          <p className="text-sm">When you request to book an experience through Staymakom:</p>
          <ul className="text-sm">
            <li>Your request is sent to the relevant hotel.</li>
            <li>The hotel reviews the request and may accept or decline it.</li>
            <li>A booking is considered confirmed only when accepted by the hotel.</li>
            <li>Once accepted, the final commercial relationship exists between you and the hotel, not with Staymakom.</li>
          </ul>
          <p className="text-sm">Staymakom is not responsible for:</p>
          <ul className="text-sm">
            <li>the accuracy of hotel information,</li>
            <li>availability,</li>
            <li>service execution,</li>
            <li>cancellations or changes made by the hotel.</li>
          </ul>

          <h2 className="text-lg">3. Prices</h2>
          <p className="text-sm">All prices are determined and provided directly by the hotels.</p>
          <p className="text-sm">
            Staymakom does not add hidden fees. Taxes (VAT), service fees, or additional charges are determined solely by the hotel.
          </p>

          <h2 className="text-lg">4. Payment (via Stripe)</h2>
          <p className="text-sm">Payments for confirmed bookings are processed securely via Stripe, our licensed payment service provider.</p>
          <ul className="text-sm">
            <li>Staymakom does not store or handle credit card information.</li>
            <li>Stripe processes the payment on behalf of the transaction.</li>
            <li>Payment obligations, refunds, or disputes are handled directly between you and the hotel under the hotel's policy.</li>
          </ul>

          <h2 className="text-lg">5. Cancellation & Refunds</h2>
          <p className="text-sm">Cancellation and refund policies are defined by each hotel.</p>
          <p className="text-sm">By booking through Staymakom, you accept:</p>
          <ul className="text-sm">
            <li>the hotel's cancellation terms,</li>
            <li>applicable refund rules,</li>
            <li>possible fees (cancellation, no-show, modification).</li>
          </ul>
          <p className="text-sm">Staymakom is not responsible for disputes regarding refunds or penalties.</p>

          <h2 className="text-lg">6. User Account</h2>
          <p className="text-sm">You are responsible for:</p>
          <ul className="text-sm">
            <li>maintaining the confidentiality of your login credentials,</li>
            <li>ensuring your information is accurate,</li>
            <li>not impersonating another person.</li>
          </ul>
          <p className="text-sm">Staymakom may suspend accounts in case of abuse or fraudulent behaviour.</p>

          <h2 className="text-lg">7. Responsibility & Liability</h2>
          <p className="text-sm">Staymakom cannot be held liable for:</p>
          <ul className="text-sm">
            <li>hotel performance or service quality,</li>
            <li>delays, accidents, damages, or issues during a stay,</li>
            <li>inaccurate or outdated hotel content,</li>
            <li>temporary unavailability of the platform.</li>
          </ul>
          <p className="text-sm">Your contractual relationship is with the hotel, not with Staymakom.</p>

          <h2 className="text-lg">8. Data & Privacy</h2>
          <p className="text-sm">
            Your personal data is processed in accordance with our{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> and Israeli data-protection laws (Privacy Protection Authority).
          </p>

          <h2 className="text-lg">9. Platform Misuse</h2>
          <p className="text-sm">We reserve the right to remove access to the platform in cases of:</p>
          <ul className="text-sm">
            <li>fraud,</li>
            <li>abusive use,</li>
            <li>repeated no-shows,</li>
            <li>activities that harm hotels or the Staymakom brand.</li>
          </ul>

          <h2 className="text-lg">10. Governing Law</h2>
          <p className="text-sm">
            These Terms & Conditions are governed by the laws of Israel. Any dispute shall be submitted to the competent courts of Tel Aviv.
          </p>

          <h2 className="text-lg">11. Contact</h2>
          <p className="text-sm">
            For any questions: <a href="mailto:hello@staymakom.com" className="text-primary hover:underline">hello@staymakom.com</a>
          </p>
        </article>
      </main>
      <LaunchFooter />
    </div>
  );
};

export default Terms;