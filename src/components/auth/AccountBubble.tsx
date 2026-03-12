import { Heart, User } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Lang = "en" | "fr" | "he";

interface AccountBubbleProps {
  lang: Lang;
  onSignIn: () => void;
  onSignUp: () => void;
  isTransparent?: boolean;
}

function getCopy(lang: Lang) {
  switch (lang) {
    case "fr":
      return {
        welcome: "Bienvenue chez",
        brand: "STAYMAKOM",
        subtitle: "Connectez-vous pour sauvegarder vos expériences préférées et accéder à votre compte.",
        signIn: "Se connecter",
        createAccount: "Créer un compte",
      };
    case "he":
      return {
        welcome: "ברוכים הבאים ל",
        brand: "STAYMAKOM",
        subtitle: "התחברו כדי לשמור חוויות אהובות ולגשת לחשבון שלכם.",
        signIn: "התחברות",
        createAccount: "יצירת חשבון",
      };
    default:
      return {
        welcome: "Welcome to",
        brand: "STAYMAKOM",
        subtitle: "Sign in to save your favorite experiences and access your account.",
        signIn: "Sign In",
        createAccount: "Create Account",
      };
  }
}

export default function AccountBubble({
  lang,
  onSignIn,
  onSignUp,
  isTransparent = false,
}: AccountBubbleProps) {
  const [open, setOpen] = useState(false);
  const copy = getCopy(lang);
  const isRTL = lang === "he";

  const handleSignIn = () => {
    setOpen(false);
    onSignIn();
  };

  const handleSignUp = () => {
    setOpen(false);
    onSignUp();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${
            isTransparent
              ? "text-white hover:bg-white/10"
              : "hover:bg-foreground/5"
          }`}
        >
          <User className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 rounded-2xl border-0 shadow-2xl overflow-hidden bg-white"
        align="end"
        sideOffset={8}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Decorative header */}
        <div className="pt-8 pb-4 px-6 text-center bg-gradient-to-b from-muted/50 to-transparent">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-serif text-xl text-foreground mb-1">
            {copy.welcome} <span className="font-bold">{copy.brand}</span>
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 space-y-3">
          <Button
            variant="cta"
            className="w-full h-12 text-base"
            onClick={handleSignIn}
          >
            {copy.signIn}
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 text-base border-border/60 hover:bg-muted/50"
            onClick={handleSignUp}
          >
            {copy.createAccount}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
