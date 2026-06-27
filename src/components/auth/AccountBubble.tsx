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
          className={`h-[30px] w-[30px] p-0 rounded-full ${
            isTransparent
              ? "text-white hover:bg-white/10"
              : "hover:bg-foreground/5"
          }`}
        >
          <User className="h-[18px] w-[18px]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 rounded-2xl border-0 shadow-2xl overflow-hidden bg-white"
        align="end"
        sideOffset={8}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Decorative header */}
        <div className="pt-8 pb-4 px-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#ad1414]/10 mb-4">
            <Heart className="h-6 w-6 text-[#ad1414]" />
          </div>
          <h3 className="font-sans text-lg font-bold uppercase tracking-[-0.02em] text-foreground mb-1">
            {copy.welcome} {copy.brand}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 space-y-3">
          {/* Sign In — style blob rouge calé sur le texte */}
          <button
            onClick={handleSignIn}
            className="w-full h-12 flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <span className="relative inline-block">
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0.5 h-3 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/40"
              />
              <span className="relative text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                {copy.signIn}
              </span>
            </span>
          </button>
          {/* Create Account — pill sombre */}
          <Button
            className="w-full rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest py-3 hover:bg-foreground/90 transition-colors"
            onClick={handleSignUp}
          >
            {copy.createAccount}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
