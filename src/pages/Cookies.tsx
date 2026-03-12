import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const Cookies = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Cookie Policy | STAYMAKOM"
        description="Learn about how STAYMAKOM uses cookies to improve your experience. Manage your cookie preferences for essential, performance, and marketing cookies."
      />
      <Header />
      <main className="flex-1 container py-8 md:py-12">
        <article className="max-w-2xl mx-auto prose prose-sm prose-slate dark:prose-invert">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Cookie Policy</h1>
          <p className="text-muted-foreground mb-6 text-sm">Last updated: December 1, 2025</p>

          <p className="lead text-sm">Staymakom uses cookies to improve your experience.</p>

          <h2 className="text-lg">Types of Cookies Used</h2>
          <ul className="text-sm">
            <li><strong>Essential cookies</strong> — required for login and booking</li>
            <li><strong>Performance cookies</strong> — Google Analytics 4</li>
            <li><strong>Marketing cookies</strong> — Meta Pixel</li>
          </ul>

          <h2 className="text-lg">Your Choices</h2>
          <p className="text-sm">You may:</p>
          <ul className="text-sm">
            <li>accept all cookies</li>
            <li>reject non-essential cookies</li>
            <li>update your preferences anytime</li>
          </ul>

          <h2 className="text-lg">Questions?</h2>
          <p className="text-sm">
            If you have any questions about our use of cookies, please contact us at{" "}
            <a href="mailto:hello@staymakom.com" className="text-primary hover:underline">hello@staymakom.com</a>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Cookies;
