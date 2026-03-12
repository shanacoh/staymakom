import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-muted">
        <div className="container text-center py-20">
          <h1 className="font-sans text-9xl font-bold text-primary mb-4">404</h1>
          <h2 className="font-sans text-3xl font-bold mb-4">Page Not Found</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Oops! The page you're looking for seems to have wandered off on its own adventure.
          </p>
          <Button asChild size="lg">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Return to Home
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;