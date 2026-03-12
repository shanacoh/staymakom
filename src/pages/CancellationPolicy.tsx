import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const CancellationPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Cancellation & Refund Policy | STAYMAKOM"
        description="Understand STAYMAKOM's cancellation and refund policies. Each hotel defines its own terms for cancellations, refunds, and modifications."
      />
      <Header />
      <main className="flex-1 container py-8 md:py-12">
        <article className="max-w-2xl mx-auto prose prose-sm prose-slate dark:prose-invert">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Cancellation & Refund Policy</h1>
          <p className="text-muted-foreground mb-6 text-sm">Last updated: December 1, 2025</p>

          <p className="lead text-sm">
            Each hotel defines its own cancellation and refund policy.
          </p>

          <p className="text-sm">When booking through Staymakom:</p>
          <ul className="text-sm">
            <li>you accept the hotel's cancellation rules,</li>
            <li>cancellation windows and fees apply based on the hotel's terms,</li>
            <li>refunds are processed exclusively by the hotel.</li>
          </ul>

          <h2 className="text-lg">What Staymakom is Not Responsible For</h2>
          <p className="text-sm">Staymakom is not responsible for:</p>
          <ul className="text-sm">
            <li>penalties</li>
            <li>no-show fees</li>
            <li>disputes related to refunds</li>
            <li>schedule changes or hotel cancellations</li>
          </ul>

          <p className="text-sm">
            <strong>Staymakom only facilitates the transmission of booking information.</strong>
          </p>

          <h2 className="text-lg">Questions?</h2>
          <p className="text-sm">
            For any questions regarding cancellations or refunds, please contact the hotel directly or reach out to us at{" "}
            <a href="mailto:hello@staymakom.com" className="text-primary hover:underline">hello@staymakom.com</a>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default CancellationPolicy;