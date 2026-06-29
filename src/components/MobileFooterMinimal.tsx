import { useLanguage } from "@/hooks/useLanguage";

const MobileFooterMinimal = () => {
  const { lang } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <div className="md:hidden py-4 text-center border-t border-border">
      <p className="text-[11px] text-muted-foreground">
        © {year} Staymakom.{" "}
        {lang === "he" ? "כל הזכויות שמורות." : lang === "fr" ? "Tous droits réservés." : "All rights reserved."}
      </p>
    </div>
  );
};

export default MobileFooterMinimal;
