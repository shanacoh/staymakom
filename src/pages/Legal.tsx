import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const Legal = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Legal Notice | STAYMAKOM"
        description="Legal notice and company information for STAYMAKOM Ltd. Learn about our company registration, contact details, and intellectual property rights."
      />
      <Header />
      <main className="flex-1 container py-8 md:py-12">
        <article className="max-w-2xl mx-auto prose prose-sm prose-slate dark:prose-invert">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Legal Notice</h1>
          <p className="text-muted-foreground mb-6 text-sm">Impressum</p>

          <h2 className="text-lg">Company Information</h2>
          <p className="text-sm">
            <strong>Staymakom Ltd</strong><br />
            6 Sokolov Street<br />
            Herzliya, Israel
          </p>

          <h2 className="text-lg">Contact</h2>
          <p className="text-sm">
            <a href="mailto:hello@staymakom.com" className="text-primary hover:underline">hello@staymakom.com</a>
          </p>

          <h2 className="text-lg">About</h2>
          <p className="text-sm">Staymakom Ltd provides a digital platform for discovering and booking experiences offered by independent hotels.</p>

          <h2 className="text-lg">Hosting Provider</h2>
          <p className="text-sm">This website is hosted on Lovable's cloud infrastructure.</p>

          <h2 className="text-lg">Intellectual Property</h2>
          <p className="text-sm">All texts, images, and content are the exclusive property of Staymakom Ltd unless otherwise stated.</p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Legal;
